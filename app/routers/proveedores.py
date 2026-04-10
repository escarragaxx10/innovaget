from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol 

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

# --- 1. REGISTRAR PROVEEDOR (Solo Admin y Gerente) ---
@router.post("/", response_model=schemas.ProveedorOut)
def crear_proveedor(
    proveedor: schemas.ProveedorCreate, 
    db: Session = Depends(get_db),
    # Normalmente el cajero no crea proveedores, solo el Admin o Gerente
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    # Verificamos si ya existe por NIT en ESTA empresa
    existe = db.query(models.Proveedor).filter(
        models.Proveedor.nit == proveedor.nit,
        models.Proveedor.empresa_id == current_user.empresa_id
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400, 
            detail="Ya tienes un proveedor registrado con este NIT"
        )

    nuevo_proveedor = models.Proveedor(
        nombre=proveedor.nombre,
        nit=proveedor.nit,
        contacto=proveedor.contacto,
        empresa_id=current_user.empresa_id # Protección SaaS
    )
    
    db.add(nuevo_proveedor)
    db.commit()
    db.refresh(nuevo_proveedor)
    return nuevo_proveedor

# --- 2. LISTAR PROVEEDORES ---
@router.get("/", response_model=List[schemas.ProveedorOut])
def listar_proveedores(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    # Solo ve los proveedores que le surten a su empresa
    return db.query(models.Proveedor).filter(
        models.Proveedor.empresa_id == current_user.empresa_id
    ).all()

# --- 3. ACTUALIZAR PROVEEDOR ---
@router.put("/{proveedor_id}", response_model=schemas.ProveedorOut)
def actualizar_proveedor(
    proveedor_id: int,
    datos: schemas.ProveedorCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    proveedor_db = db.query(models.Proveedor).filter(
        models.Proveedor.id == proveedor_id,
        models.Proveedor.empresa_id == current_user.empresa_id
    ).first()
    
    if not proveedor_db:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    for key, value in datos.model_dump().items():
        setattr(proveedor_db, key, value)
    
    db.commit()
    db.refresh(proveedor_db)
    return proveedor_db

# --- 4. ELIMINAR PROVEEDOR (Solo Admin) ---
@router.delete("/{proveedor_id}")
def eliminar_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    proveedor_db = db.query(models.Proveedor).filter(
        models.Proveedor.id == proveedor_id,
        models.Proveedor.empresa_id == current_user.empresa_id
    ).first()
    
    if not proveedor_db:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    db.delete(proveedor_db)
    db.commit()
    return {"mensaje": f"Proveedor {proveedor_db.nombre} eliminado"}