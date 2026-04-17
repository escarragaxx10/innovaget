from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import get_password_hash, get_current_user, verificar_rol

router = APIRouter(prefix="/usuarios", tags=["Gestión de Personal"])

# --- 1. CREAR EMPLEADO ---
@router.post("/crear-empleado", response_model=schemas.UserOut)
def crear_empleado(
    usuario_in: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    sucursal = db.query(models.Sucursal).filter(
        models.Sucursal.id == usuario_in.sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not sucursal:
        raise HTTPException(status_code=403, detail="La sucursal no pertenece a tu empresa")

    existe_user = db.query(models.User).filter(models.User.email == usuario_in.email).first()
    existe_emp = db.query(models.Empleado).filter(models.Empleado.email == usuario_in.email).first()
    if existe_user or existe_emp:
        raise HTTPException(status_code=400, detail="El correo ya está registrado en el sistema")

    nuevo_empleado = models.Empleado(
        email=usuario_in.email,
        nombre=getattr(usuario_in, "nombre", None),
        hashed_password=get_password_hash(usuario_in.password),
        role=usuario_in.role,
        empresa_id=current_user.empresa_id,
        sucursal_id=usuario_in.sucursal_id
    )

    try:
        db.add(nuevo_empleado)
        db.commit()
        db.refresh(nuevo_empleado)
        return nuevo_empleado
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {str(e)}")

# --- 2. LISTAR EMPLEADOS ---
@router.get("/mis-empleados", response_model=List[schemas.UserOut])
def listar_mis_empleados(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    return db.query(models.Empleado).filter(
        models.Empleado.empresa_id == current_user.empresa_id
    ).all()

# ✅ RUTAS FIJAS ANTES QUE /{empleado_id}

# --- 3. VER PERFIL ---
@router.get("/perfil")
def obtener_perfil(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    empresa = db.query(models.Empresa).filter(
        models.Empresa.id == current_user.empresa_id
    ).first()

    sucursal = None
    if hasattr(current_user, "sucursal_id") and current_user.sucursal_id:
        s = db.query(models.Sucursal).filter(
            models.Sucursal.id == current_user.sucursal_id
        ).first()
        if s:
            sucursal = {"id": s.id, "nombre": s.nombre, "ciudad": s.ciudad}

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "nombre": getattr(current_user, "nombre", None),
        "empresa": {
            "nombre_sas": empresa.nombre_sas,
            "nit": empresa.nit,
            "mail_email": empresa.mail_email,
        } if empresa else None,
        "sucursal": sucursal,
    }

# --- 4. CAMBIAR CONTRASEÑA ---
@router.put("/cambiar-password")
def cambiar_password(
    datos: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from app.core.security import verify_password, get_password_hash
    if not verify_password(datos["password_actual"], current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    current_user.hashed_password = get_password_hash(datos["password_nueva"])
    db.commit()
    return {"mensaje": "Contraseña actualizada exitosamente"}

# --- 5. ACTUALIZAR PERFIL ---
@router.put("/actualizar-perfil")
def actualizar_perfil(
    datos: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    nombre = datos.get("nombre")
    mail_email = datos.get("mail_email")
    mail_password = datos.get("mail_password")

    if nombre is not None:
        current_user.nombre = nombre

    if isinstance(current_user, models.User) and current_user.role == "admin" and current_user.empresa_id:
        empresa = db.query(models.Empresa).filter(
            models.Empresa.id == current_user.empresa_id
        ).first()
        if empresa:
            if mail_email:
                empresa.mail_email = mail_email
            if mail_password:
                empresa.mail_password = mail_password

    db.commit()
    return {"mensaje": "Perfil actualizado correctamente"}

# ✅ RUTAS CON PARÁMETRO AL FINAL

# --- 6. ACTUALIZAR EMPLEADO ---
@router.put("/{empleado_id}", response_model=schemas.UserOut)
def actualizar_empleado(
    empleado_id: int,
    datos: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    empleado = db.query(models.Empleado).filter(
        models.Empleado.id == empleado_id,
        models.Empleado.empresa_id == current_user.empresa_id
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    empleado.role = datos.role
    empleado.sucursal_id = datos.sucursal_id
    if getattr(datos, "nombre", None):
        empleado.nombre = datos.nombre
    if datos.password:
        empleado.hashed_password = get_password_hash(datos.password)

    db.commit()
    db.refresh(empleado)
    return empleado

# --- 7. ELIMINAR EMPLEADO ---
@router.delete("/{empleado_id}")
def eliminar_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    empleado = db.query(models.Empleado).filter(
        models.Empleado.id == empleado_id,
        models.Empleado.empresa_id == current_user.empresa_id
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    db.delete(empleado)
    db.commit()
    return {"mensaje": f"Empleado {empleado.email} eliminado correctamente"}