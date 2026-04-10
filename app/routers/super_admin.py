import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
import os

router = APIRouter(prefix="/super-admin", tags=["Control de Licencias (SOLO INGENIERO)"])

def validar_master_key(x_master_key: str = Header(...)):
    """Dependencia reutilizable para validar la clave maestra"""
    if x_master_key != os.getenv("MASTER_KEY"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para realizar esta acción"
        )

# --- 1. GENERAR TOKEN ÚNICO ---
@router.post("/generar-token")
def generar_token(
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)  # ✅ Reutilizable como dependencia
):
    nuevo_codigo = str(uuid.uuid4()).upper()[:8]

    db_token = models.TokenRegistro(codigo=nuevo_codigo, usado=False)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)

    return {
        "mensaje": "Licencia generada con éxito",
        "codigo_activacion": nuevo_codigo,
        "instrucciones": "Entrega este código al cliente. Solo funcionará una vez."
    }

# --- 2. GENERAR TOKENS EN LOTE ---
@router.post("/generar-tokens-lote")
def generar_tokens_lote(
    cantidad: int = 5,
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    # ✅ NUEVO: Útil para generar varios tokens de una vez
    if cantidad < 1 or cantidad > 50:
        raise HTTPException(status_code=400, detail="La cantidad debe estar entre 1 y 50")

    tokens = []
    for _ in range(cantidad):
        codigo = str(uuid.uuid4()).upper()[:8]
        db_token = models.TokenRegistro(codigo=codigo, usado=False)
        db.add(db_token)
        tokens.append(codigo)

    db.commit()
    return {
        "mensaje": f"{cantidad} licencias generadas",
        "codigos": tokens
    }

# --- 3. VER TODOS LOS TOKENS ---
@router.get("/ver-tokens")
def listar_tokens(
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    tokens = db.query(models.TokenRegistro).order_by(
        models.TokenRegistro.fecha_creacion.desc()
    ).all()

    return {
        "total": len(tokens),
        "disponibles": sum(1 for t in tokens if not t.usado),
        "usados": sum(1 for t in tokens if t.usado),
        "tokens": tokens
    }