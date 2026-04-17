import uuid
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
from datetime import datetime, timezone, timedelta
from app.core.security import create_access_token, verify_password, get_password_hash

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    # 1. Buscar primero en admins (User)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    user_type = "admin"

    # 2. Si no es admin, buscar en empleados
    if not user:
        user = db.query(models.Empleado).filter(models.Empleado.email == form_data.username).first()
        user_type = "empleado"

    # 3. Verificar si existe y si la clave coincide
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Verificar si la empresa está activa
    if user.empresa_id:
        empresa = db.query(models.Empresa).filter(models.Empresa.id == user.empresa_id).first()
        if empresa and not empresa.activa:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tu empresa ha sido desactivada. Contacta al administrador del sistema.",
            )

    # 5. Crear token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "empresa_id": user.empresa_id,
            "user_type": user_type,
            "sucursal_id": int(getattr(user, "sucursal_id", None)) if getattr(user, "sucursal_id", None) else None
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "empresa_id": user.empresa_id,
        "sucursal_id": int(getattr(user, "sucursal_id", None)) if getattr(user, "sucursal_id", None) else None,
        "user_type": user_type
    }


# --- RECUPERAR CONTRASEÑA ---
@router.post("/recuperar-password")
async def recuperar_password(
    datos: dict,
    db: Session = Depends(get_db)
):
    email = datos.get("email", "").lower().strip()

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = db.query(models.Empleado).filter(models.Empleado.email == email).first()

    if user:
        # Invalidar tokens anteriores
        tokens_anteriores = db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.email == email,
            models.PasswordResetToken.usado == False
        ).all()
        for t in tokens_anteriores:
            t.usado = True

        # Crear nuevo token en hora local (sin timezone)
        token = str(uuid.uuid4())
        nuevo_token = models.PasswordResetToken(
            email=email,
            token=token,
            usado=False,
            fecha_vencimiento=datetime.now() + timedelta(hours=1)
        )
        db.add(nuevo_token)
        db.commit()

        # Enviar correo
        from app.core.mailer import enviar_email_recuperacion
        await enviar_email_recuperacion(
            destinatario=email,
            token=token,
            nombre=email.split("@")[0]
        )

    return {"mensaje": "Si el correo existe, recibirás un enlace de recuperación en los próximos minutos."}


# --- RESET CONTRASEÑA ---
@router.post("/reset-password")
def reset_password(
    datos: dict,
    db: Session = Depends(get_db)
):
    token_str = datos.get("token", "")
    password_nueva = datos.get("password_nueva", "")

    if not token_str or not password_nueva:
        raise HTTPException(status_code=400, detail="Token y contraseña son requeridos")

    if len(password_nueva) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener mínimo 8 caracteres")

    token_db = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token_str,
        models.PasswordResetToken.usado == False
    ).first()

    if not token_db:
        raise HTTPException(status_code=400, detail="El enlace es inválido o ya fue utilizado")

    # Comparar en hora local (sin timezone)
    ahora = datetime.now()
    vencimiento = token_db.fecha_vencimiento
    if vencimiento.tzinfo is not None:
        vencimiento = vencimiento.replace(tzinfo=None)

    if ahora > vencimiento:
        raise HTTPException(status_code=400, detail="El enlace ha expirado. Solicita uno nuevo.")

    email = token_db.email
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = db.query(models.Empleado).filter(models.Empleado.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.hashed_password = get_password_hash(password_nueva)
    token_db.usado = True
    db.commit()

    return {"mensaje": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."}