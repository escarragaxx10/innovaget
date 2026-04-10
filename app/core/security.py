import os
import hashlib
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from dotenv import load_dotenv
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models

load_dotenv()

# --- CONFIGURACIÓN ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

# ✅ CORREGIDO: Validar que las variables críticas existan al arrancar
if not SECRET_KEY:
    raise RuntimeError("❌ SECRET_KEY no está definida en el archivo .env")
if not ALGORITHM:
    raise RuntimeError("❌ ALGORITHM no está definido en el archivo .env")

# Passlib usará bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- FUNCIONES DE CLAVE (PROTECCIÓN 72 BYTES) ---
def get_password_hash(password: str) -> str:
    if len(password) > 71:
        password = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password) > 71:
        plain_password = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    # ✅ CORREGIDO: datetime.utcnow() está deprecado en Python 3.12+
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- OBTENER USUARIO ACTUAL ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        # ✅ NUEVO: Leemos el tipo de usuario desde el token para evitar doble query
        user_type: str = payload.get("user_type", "admin")
        
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # ✅ OPTIMIZADO: Solo hacemos 1 query según el tipo guardado en el token
    if user_type == "empleado":
        user = db.query(models.Empleado).filter(models.Empleado.email == email).first()
    else:
        user = db.query(models.User).filter(models.User.email == email).first()

    # Fallback por seguridad: si no se encontró, intentamos en la otra tabla
    if user is None:
        if user_type == "empleado":
            user = db.query(models.User).filter(models.User.email == email).first()
        else:
            user = db.query(models.Empleado).filter(models.Empleado.email == email).first()

    if user is None:
        raise credentials_exception
        
    return user

# --- VERIFICADOR DE ROLES ---
def verificar_rol(roles_permitidos: list):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles permitidos: {roles_permitidos}"
            )
        return current_user
    return role_checker