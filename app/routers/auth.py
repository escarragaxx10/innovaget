from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
from app.core.security import create_access_token, verify_password

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

    # 4. ✅ MEJORADO: Incluimos user_type en el token para evitar doble query en cada request
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "empresa_id": user.empresa_id,
            "user_type": user_type,  # ✅ NUEVO
            # Incluimos sucursal_id para empleados
            "sucursal_id": getattr(user, "sucursal_id", None)  # ✅ NUEVO
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "empresa_id": user.empresa_id,
        "sucursal_id": getattr(user, "sucursal_id", None),  # ✅ NUEVO
        "user_type": user_type                               # ✅ NUEVO
    }