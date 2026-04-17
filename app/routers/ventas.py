from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

from app.core.pdf_generator import generar_pdf_factura
from app.core.mailer import enviar_factura_email

router = APIRouter(prefix="/ventas", tags=["Ventas"])

# --- 1. REGISTRAR VENTA ---
@router.post("/", response_model=schemas.VentaOut)
def crear_venta(
    venta: schemas.VentaCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    # Validación de caja abierta
    caja_activa = db.query(models.Caja).filter(
        models.Caja.id == venta.caja_id,
        models.Caja.sucursal_id == venta.sucursal_id,
        models.Caja.estado == "ABIERTA"
    ).first()

    if not caja_activa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operación denegada: La caja seleccionada no está ABIERTA en esta sucursal."
        )

    # Definir vendedor correctamente
    vendedor_id = None
    vendedor_empleado_id = None
    if isinstance(current_user, models.User):
        vendedor_id = current_user.id
    elif isinstance(current_user, models.Empleado):
        vendedor_empleado_id = current_user.id

    # Crear venta
    nueva_venta = models.Venta(

        cliente_id=venta.cliente_id,
        sucursal_id=venta.sucursal_id,
        empresa_id=venta.empresa_id,
        vendedor_id=vendedor_id,
        vendedor_empleado_id=vendedor_empleado_id,
        caja_id=venta.caja_id,
        medio_pago=venta.medio_pago,
        pago_con=venta.pago_con,
        descuento_porcentaje=venta.descuento_porcentaje or 0.0,
        descuento_valor=venta.descuento_valor or 0.0,
        total=0,
        estado="COMPLETADA"
        
        
    )

    db.add(nueva_venta)
    db.flush()

    total_factura = 0

    # Procesar productos
    for item in venta.items:
        producto = db.query(models.Producto).filter(
            models.Producto.id == item.producto_id,
            models.Producto.sucursal_id == venta.sucursal_id
        ).first()

        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto ID {item.producto_id} no encontrado")

        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}"
            )

        producto.stock -= item.cantidad
        subtotal_item = producto.precio_venta * item.cantidad
        total_factura += subtotal_item

        db.add(models.DetalleVenta(
            venta_id=nueva_venta.id,
            producto_id=producto.id,
            cantidad=item.cantidad,
            precio_unitario=producto.precio_venta,
            subtotal=subtotal_item
        ))

        db.add(models.MovimientoInventario(
            producto_id=producto.id,
            tipo="SALIDA",
            cantidad=item.cantidad,
            motivo=f"Venta Factura #{nueva_venta.id}",
            usuario_id=current_user.id if isinstance(current_user, models.User) else None
        ))

    # Aplicar descuento
    descuento_aplicado = 0.0
    if venta.descuento_porcentaje and venta.descuento_porcentaje > 0:
        descuento_aplicado = total_factura * (venta.descuento_porcentaje / 100)
    elif venta.descuento_valor and venta.descuento_valor > 0:
        descuento_aplicado = venta.descuento_valor

    total_con_descuento = max(0, total_factura - descuento_aplicado)
    nueva_venta.total = total_con_descuento

    # Calcular cambio
    if nueva_venta.pago_con and nueva_venta.pago_con >= total_con_descuento:
        nueva_venta.cambio = nueva_venta.pago_con - total_con_descuento
    else:
        nueva_venta.cambio = 0

    db.commit()
    db.refresh(nueva_venta)

    # ✅ CORRECTO: Envío de correo ANTES del return
    if nueva_venta.cliente_id:
     cliente = db.query(models.Cliente).filter(
        models.Cliente.id == nueva_venta.cliente_id
    ).first()
    if cliente and cliente.email:
        try:
            empresa = db.query(models.Empresa).filter(
                models.Empresa.id == nueva_venta.empresa_id
            ).first()
            pdf_content = generar_pdf_factura(nueva_venta, empresa)
            background_tasks.add_task(
                enviar_factura_email,
                destinatario=cliente.email,
                pdf_content=pdf_content,
                factura_id=nueva_venta.id,
                nombre_cliente=cliente.nombre,
                nombre_empresa=empresa.nombre_sas if empresa else "Innovagét ERP",
                mail_email=empresa.mail_email if empresa else None,        # ✅ AGREGAR
                mail_password=empresa.mail_password if empresa else None,  # ✅ AGREGAR
            )
        except Exception as e:
            print(f"❌ Error al preparar correo: {str(e)}")
    return nueva_venta  # ✅ return AL FINAL

# --- 2. ANULAR VENTA ---
@router.post("/anular/{venta_id}")
def anular_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    venta = db.query(models.Venta).filter(models.Venta.id == venta_id).first()

    if not venta or venta.estado == "ANULADA":
        raise HTTPException(status_code=400, detail="Venta no encontrada o ya anulada")

    for detalle in venta.detalles:
        producto = detalle.producto
        if producto:
            producto.stock += detalle.cantidad
            db.add(models.MovimientoInventario(
                producto_id=producto.id,
                tipo="ENTRADA",
                cantidad=detalle.cantidad,
                motivo=f"Anulación Factura #{venta.id}",
                usuario_id=current_user.id
            ))

    venta.estado = "ANULADA"
    db.commit()
    return {"mensaje": f"Venta #{venta.id} anulada y stock restaurado."}

# --- 3. LISTAR HISTORIAL ---
@router.get("/", response_model=List[schemas.VentaOut])
def listar_historial_ventas(
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin"]))
):
    return db.query(models.Venta).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id
    ).order_by(models.Venta.fecha.desc()).all()