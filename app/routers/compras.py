from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol 

router = APIRouter(prefix="/compras", tags=["Compras / Ingresos"])

@router.post("/", response_model=schemas.ProductoOut)
def realizar_ingreso_mercancia(
    ingreso: schemas.IngresoMercancia, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    # 1. Buscar el producto y validar que pertenezca a la empresa del admin
    producto = db.query(models.Producto).join(models.Sucursal).filter(
        models.Producto.id == ingreso.producto_id,
        models.Sucursal.empresa_id == current_user.empresa_id  # ✅ Seguridad SaaS
    ).first()
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece a tu empresa")

    # 2. 🧮 CALCULAR PRECIO DE VENTA
    # Opción A: Si viene precio_venta manual, lo usamos directamente
    # Opción B: Si viene margen_deseado, calculamos el precio automáticamente
    if ingreso.precio_venta_manual is not None:
        nuevo_precio_venta = ingreso.precio_venta_manual

    elif ingreso.margen_deseado is not None:
        # Validar que el margen no sea 100% (división por cero)
        if ingreso.margen_deseado <= 0 or ingreso.margen_deseado >= 100:
            raise HTTPException(
                status_code=400,
                detail="El margen debe estar entre 1% y 99%"
            )
        # Fórmula: Costo / (1 - Margen%) para que el margen sea sobre precio final
        nuevo_precio_venta = ingreso.costo_unitario / (1 - (ingreso.margen_deseado / 100))

    else:
        # Si no viene ninguno, mantener el precio actual del producto
        nuevo_precio_venta = producto.precio_venta

    # 3. Actualizar el producto
    producto.stock += ingreso.cantidad
    producto.precio_compra = ingreso.costo_unitario
    producto.precio_venta = round(nuevo_precio_venta)  # Redondeamos a entero (COP)

    # 4. 🛡️ Registrar movimiento en el Kardex
    motivo = f"Compra a Prov ID: {ingreso.proveedor_id}"
    if ingreso.margen_deseado:
        motivo += f" (Margen: {ingreso.margen_deseado}%)"

    nuevo_movimiento = models.MovimientoInventario(
        producto_id=producto.id,
        tipo="ENTRADA",
        cantidad=ingreso.cantidad,
        motivo=motivo,
        usuario_id=current_user.id
    )
    db.add(nuevo_movimiento)

    db.commit()
    db.refresh(producto)
    
    return producto