from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import get_password_hash, verificar_rol

router = APIRouter(prefix="/empresas", tags=["Registro Maestro (SaaS)"])

# --- 1. REGISTRO DE EMPRESA + ADMIN ---
@router.post("/registro-maestro", response_model=schemas.RegistroExitoso)
def registro_maestro(datos: schemas.EmpresaYAdminCreate, db: Session = Depends(get_db)):

    # 1. Validar token de activación
    token_db = db.query(models.TokenRegistro).filter(
        models.TokenRegistro.codigo == datos.codigo_activacion.strip().upper(),  # ✅ Normalizar a mayúsculas
        models.TokenRegistro.usado == False
    ).first()

    if not token_db:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Código de activación inválido o ya utilizado."
        )

    # ✅ Verificar que el NIT y email no estén ya registrados
    if db.query(models.Empresa).filter(models.Empresa.nit == datos.nit).first():
        raise HTTPException(status_code=400, detail="Ya existe una empresa registrada con este NIT")

    if db.query(models.User).filter(models.User.email == datos.email_admin).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este correo")

    try:
        # 2. Crear empresa
        nueva_empresa = models.Empresa(
            nombre_sas=datos.nombre_sas,
            nit=datos.nit,
            activa=True
        )
        db.add(nueva_empresa)
        db.flush()

        # 3. Crear administrador
        nuevo_admin = models.User(
            email=datos.email_admin,
            hashed_password=get_password_hash(datos.password_admin),
            role="admin",
            empresa_id=nueva_empresa.id
        )
        db.add(nuevo_admin)

        # 4. Quemar el token
        token_db.usado = True

        # 5. Commit final
        db.commit()
        db.refresh(nueva_empresa)
        db.refresh(nuevo_admin)

        return {
            "mensaje": f"¡{nueva_empresa.nombre_sas} registrada exitosamente en Innovagét!",
            "empresa_id": nueva_empresa.id,
            "admin_id": nuevo_admin.id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en el registro: {str(e)}")

# --- 2. VER MI EMPRESA ---
@router.get("/mi-empresa", response_model=schemas.EmpresaOut)
def ver_mi_empresa(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    empresa = db.query(models.Empresa).filter(
        models.Empresa.id == current_user.empresa_id
    ).first()

    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    return empresa