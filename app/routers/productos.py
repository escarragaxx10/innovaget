from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

router = APIRouter(prefix="/productos", tags=["Productos"])

# --- 1. CREAR PRODUCTO ---
@router.post("/", response_model=schemas.ProductoOut)
def crear_producto(
    producto: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    sucursal = db.query(models.Sucursal).filter(
        models.Sucursal.id == producto.sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not sucursal:
        raise HTTPException(status_code=403, detail="No tienes permiso para añadir productos a esta sucursal")

    existe = db.query(models.Producto).filter(
        models.Producto.nombre == producto.nombre,
        models.Producto.sucursal_id == producto.sucursal_id
    ).first()

    if existe:
        raise HTTPException(status_code=400, detail="Este producto ya existe en esta sucursal")

    datos = producto.model_dump(exclude={"empresa_id"})
    nuevo_producto = models.Producto(
        **datos,
        empresa_id=current_user.empresa_id  # ✅ Desde el token
    )
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

# --- 2. LISTAR PRODUCTOS ---
@router.get("/", response_model=List[schemas.ProductoOut])
def listar_productos(
    sucursal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "gerente", "cajero", "empleado"]))
):
    query = db.query(models.Producto).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id
    )
    # ✅ Si es empleado, solo ve su sucursal
    if current_user.role in ["cajero", "empleado"] and hasattr(current_user, "sucursal_id"):
        query = query.filter(models.Producto.sucursal_id == current_user.sucursal_id)
    elif sucursal_id:
        query = query.filter(models.Producto.sucursal_id == sucursal_id)
    return query.all()

# --- 3. EDITAR PRODUCTO ---
@router.put("/{producto_id}", response_model=schemas.ProductoOut)
def actualizar_producto(
    producto_id: int,
    producto_data: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    producto_db = db.query(models.Producto).join(models.Sucursal).filter(
        models.Producto.id == producto_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece a tu empresa")

    for key, value in producto_data.model_dump(exclude={"empresa_id"}).items():
        setattr(producto_db, key, value)

    db.commit()
    db.refresh(producto_db)
    return producto_db

# --- 4. ELIMINAR PRODUCTO ---
@router.delete("/{producto_id}")
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    producto_db = db.query(models.Producto).join(models.Sucursal).filter(
        models.Producto.id == producto_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(producto_db)
    db.commit()
    return {"mensaje": "Producto eliminado correctamente"}