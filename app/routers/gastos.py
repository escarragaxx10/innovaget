from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

router = APIRouter(prefix="/gastos", tags=["Gastos Operativos"])

# --- 1. REGISTRAR GASTO ---
@router.post("/", response_model=schemas.GastoOut)
def registrar_gasto(
    gasto: schemas.GastoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero", "empleado"]))
):
    # Validar que la sucursal pertenezca a la empresa
    sucursal = db.query(models.Sucursal).filter(
        models.Sucursal.id == gasto.sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not sucursal:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta sucursal")

    nuevo_gasto = models.Gasto(
        descripcion=gasto.descripcion,
        monto=gasto.monto,
        sucursal_id=gasto.sucursal_id,
        caja_id=gasto.caja_id,
        usuario_id=current_user.id if hasattr(current_user, 'empresa_id') else None,
        empleado_id=current_user.id if not hasattr(current_user, 'empresa_id') else None,
        fecha=datetime.now(timezone.utc)
    )

    db.add(nuevo_gasto)
    db.commit()
    db.refresh(nuevo_gasto)
    return nuevo_gasto

# --- 2. LISTAR GASTOS DEL DÍA POR CAJA ---
@router.get("/caja/{caja_id}", response_model=List[schemas.GastoOut])
def listar_gastos_caja(
    caja_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero", "gerente", "empleado"]))
):
    gastos = db.query(models.Gasto).filter(
        models.Gasto.caja_id == caja_id
    ).order_by(models.Gasto.fecha.desc()).all()
    return gastos

# --- 3. LISTAR GASTOS POR SUCURSAL (HOY) ---
@router.get("/sucursal/{sucursal_id}", response_model=List[schemas.GastoOut])
def listar_gastos_sucursal(
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "gerente"]))
):
    hoy = datetime.now(timezone.utc).date()
    gastos = db.query(models.Gasto).filter(
        models.Gasto.sucursal_id == sucursal_id,
        func.date(models.Gasto.fecha) == hoy
    ).order_by(models.Gasto.fecha.desc()).all()
    return gastos

# --- 4. ELIMINAR GASTO (Solo admin) ---
@router.delete("/{gasto_id}")
def eliminar_gasto(
    gasto_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin"]))
):
    gasto = db.query(models.Gasto).join(models.Sucursal).filter(
        models.Gasto.id == gasto_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    db.delete(gasto)
    db.commit()
    return {"mensaje": "Gasto eliminado correctamente"}