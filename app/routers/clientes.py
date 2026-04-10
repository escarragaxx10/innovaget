from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol 

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# --- 1. REGISTRAR CLIENTE ---
@router.post("/", response_model=schemas.ClienteOut)
def crear_cliente(
    cliente: schemas.ClienteCreate, 
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin","cajero"]))
):
    # Verificamos si el cliente ya existe por Cédula/NIT en ESTA empresa
    existe = db.query(models.Cliente).filter(
        models.Cliente.cedula_nit == cliente.cedula_nit,
        models.Cliente.empresa_id == current_user.empresa_id
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400, 
            detail="Ya existe un cliente con este documento en tu base de datos"
        )

    # ✅ CORREGIDO: Extraemos los datos sin empresa_id para evitar duplicado,
    # y lo asignamos manualmente desde el token del usuario logueado (seguridad SaaS)
    datos = cliente.model_dump(exclude={"empresa_id"})
    nuevo_cliente = models.Cliente(
        **datos,
        empresa_id=current_user.empresa_id
    )
    
    try:
        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)
        return nuevo_cliente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")

# --- 2. LISTAR MIS CLIENTES ---
@router.get("/", response_model=List[schemas.ClienteOut])
def listar_clientes(
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    return db.query(models.Cliente).filter(
        models.Cliente.empresa_id == current_user.empresa_id
    ).all()

# --- 3. BUSCAR CLIENTE POR CÉDULA/NIT ---
@router.get("/buscar/{cedula_nit}", response_model=schemas.ClienteOut)
def buscar_cliente(
    cedula_nit: str,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    # ✅ NUEVO: Útil para buscar rápido en caja sin cargar toda la lista
    cliente = db.query(models.Cliente).filter(
        models.Cliente.cedula_nit == cedula_nit,
        models.Cliente.empresa_id == current_user.empresa_id
    ).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    return cliente

# --- 4. EDITAR CLIENTE ---
@router.put("/{cliente_id}", response_model=schemas.ClienteOut)
def actualizar_cliente(
    cliente_id: int,
    datos: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    cliente_db = db.query(models.Cliente).filter(
        models.Cliente.id == cliente_id,
        models.Cliente.empresa_id == current_user.empresa_id
    ).first()
    
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # ✅ CORREGIDO: Excluimos empresa_id para que no se pueda cambiar por petición
    for key, value in datos.model_dump(exclude={"empresa_id"}).items():
        setattr(cliente_db, key, value)
    
    db.commit()
    db.refresh(cliente_db)
    return cliente_db

# --- 5. ELIMINAR CLIENTE (Solo Admin) ---
@router.delete("/{cliente_id}")
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    cliente_db = db.query(models.Cliente).filter(
        models.Cliente.id == cliente_id,
        models.Cliente.empresa_id == current_user.empresa_id
    ).first()
    
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    db.delete(cliente_db)
    db.commit()
    return {"mensaje": f"Cliente {cliente_db.nombre} eliminado correctamente"}