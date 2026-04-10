from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

router = APIRouter(prefix="/sucursales", tags=["Sucursales"])

# --- 1. CREAR SUCURSAL ---
@router.post("/", response_model=schemas.SucursalOut)
def crear_sucursal(
    datos: schemas.SucursalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    nueva_sucursal = models.Sucursal(
        nombre=datos.nombre,
        direccion=datos.direccion,
        ciudad=datos.ciudad,
        empresa_id=current_user.empresa_id  # ✅ Siempre desde el token, no del body
    )

    db.add(nueva_sucursal)
    db.commit()
    db.refresh(nueva_sucursal)
    return nueva_sucursal

# --- 2. LISTAR SUCURSALES ---
@router.get("/", response_model=List[schemas.SucursalOut])
def listar_sucursales(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente", "cajero"]))
):
    return db.query(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id
    ).all()

# --- 3. ACTUALIZAR SUCURSAL ---
@router.put("/{sucursal_id}", response_model=schemas.SucursalOut)
def actualizar_sucursal(
    sucursal_id: int,
    datos: schemas.SucursalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    sucursal = db.query(models.Sucursal).filter(
        models.Sucursal.id == sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    sucursal.nombre = datos.nombre
    sucursal.direccion = datos.direccion
    sucursal.ciudad = datos.ciudad

    db.commit()
    db.refresh(sucursal)
    return sucursal

# --- 4. ELIMINAR SUCURSAL ---
@router.delete("/{sucursal_id}")
def eliminar_sucursal(
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    sucursal = db.query(models.Sucursal).filter(
        models.Sucursal.id == sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada o no tienes permisos")

    # ✅ NUEVO: Advertir si tiene productos o empleados activos
    tiene_productos = db.query(models.Producto).filter(
        models.Producto.sucursal_id == sucursal_id
    ).count()

    tiene_empleados = db.query(models.Empleado).filter(
        models.Empleado.sucursal_id == sucursal_id
    ).count()

    if tiene_productos > 0 or tiene_empleados > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No puedes eliminar esta sucursal. Tiene {tiene_productos} producto(s) y {tiene_empleados} empleado(s) activos."
        )

    db.delete(sucursal)
    db.commit()
    return {"mensaje": f"Sucursal '{sucursal.nombre}' eliminada con éxito"}