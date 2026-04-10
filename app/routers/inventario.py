from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

router = APIRouter(prefix="/inventario", tags=["Gestión de Inventario"])

# --- 1. AJUSTE MANUAL (Mermas, Daños, Hallazgos) ---
@router.post("/ajuste", response_model=schemas.MovimientoInventarioOut)
def ajustar_stock_manual(
    ajuste: schemas.MovimientoInventarioCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    # ✅ CORREGIDO: Validar que el producto pertenezca a la empresa del usuario
    producto = db.query(models.Producto).join(models.Sucursal).filter(
        models.Producto.id == ajuste.producto_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece a tu empresa")

    # ✅ Validar tipo de ajuste
    if ajuste.tipo not in ("ENTRADA", "SALIDA", "AJUSTE"):
        raise HTTPException(status_code=400, detail="Tipo debe ser ENTRADA, SALIDA o AJUSTE")

    # Aplicar cambio al stock
    if ajuste.tipo == "SALIDA":
        if producto.stock < ajuste.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente. Disponible: {producto.stock}"
            )
        producto.stock -= ajuste.cantidad
    else:
        producto.stock += ajuste.cantidad

    if producto.stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"El ajuste dejaría el stock en negativo"
        )

    # Registrar en el Kardex
    nuevo_movimiento = models.MovimientoInventario(
        producto_id=producto.id,
        tipo=ajuste.tipo,
        cantidad=ajuste.cantidad,
        motivo=ajuste.motivo,
        usuario_id=current_user.id
    )

    db.add(nuevo_movimiento)
    db.commit()
    db.refresh(nuevo_movimiento)
    return nuevo_movimiento

# --- 2. KARDEX (Historial de un Producto) ---
@router.get("/historial/{producto_id}", response_model=List[schemas.MovimientoInventarioOut])
def obtener_historial_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    # ✅ Validar que el producto pertenezca a la empresa
    producto = db.query(models.Producto).join(models.Sucursal).filter(
        models.Producto.id == producto_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece a tu empresa")

    historial = db.query(models.MovimientoInventario).filter(
        models.MovimientoInventario.producto_id == producto_id
    ).order_by(models.MovimientoInventario.fecha.desc()).all()

    if not historial:
        raise HTTPException(status_code=404, detail="No hay movimientos registrados para este producto")

    return historial

# --- 3. STOCK CRÍTICO ---
@router.get("/stock-critico", response_model=List[schemas.ProductoStockCritico])
def obtener_stock_critico(
    limite: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    productos_bajos = db.query(
        models.Producto.id,
        models.Producto.nombre,
        models.Producto.stock,
        models.Sucursal.nombre.label("sucursal_nombre")
    ).join(models.Sucursal).filter(
        models.Producto.stock <= limite,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).all()

    return productos_bajos