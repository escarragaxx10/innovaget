import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import models
from datetime import datetime, timezone, timedelta
import os

router = APIRouter(prefix="/super-admin", tags=["Control de Licencias (SOLO INGENIERO)"])

def validar_master_key(x_master_key: str = Header(...)):
    if x_master_key != os.getenv("MASTER_KEY"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para realizar esta acción"
        )

# --- 1. GENERAR TOKEN ÚNICO ---
@router.post("/generar-token")
def generar_token(
    dias_vigencia: int = 30,
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    nuevo_codigo = str(uuid.uuid4()).upper()[:8]
    fecha_vencimiento = datetime.now(timezone.utc) + timedelta(days=dias_vigencia)

    db_token = models.TokenRegistro(
        codigo=nuevo_codigo,
        usado=False,
        fecha_vencimiento=fecha_vencimiento
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)

    return {
        "mensaje": "Licencia generada con éxito",
        "codigo_activacion": nuevo_codigo,
        "vence_en_dias": dias_vigencia,
        "fecha_vencimiento": fecha_vencimiento.isoformat(),
        "instrucciones": "Entrega este código al cliente. Solo funcionará una vez."
    }

# --- 2. GENERAR TOKENS EN LOTE ---
@router.post("/generar-tokens-lote")
def generar_tokens_lote(
    cantidad: int = 5,
    dias_vigencia: int = 30,
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    if cantidad < 1 or cantidad > 50:
        raise HTTPException(status_code=400, detail="La cantidad debe estar entre 1 y 50")

    fecha_vencimiento = datetime.now(timezone.utc) + timedelta(days=dias_vigencia)
    tokens = []

    for _ in range(cantidad):
        codigo = str(uuid.uuid4()).upper()[:8]
        db_token = models.TokenRegistro(
            codigo=codigo,
            usado=False,
            fecha_vencimiento=fecha_vencimiento
        )
        db.add(db_token)
        tokens.append(codigo)

    db.commit()
    return {
        "mensaje": f"{cantidad} licencias generadas",
        "codigos": tokens,
        "fecha_vencimiento": fecha_vencimiento.isoformat(),
        "vence_en_dias": dias_vigencia
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

    ahora = datetime.now(timezone.utc)

    tokens_data = []
    for t in tokens:
        # Calcular días restantes
        dias_restantes = None
        vencido = False
        if t.fecha_vencimiento:
            venc = t.fecha_vencimiento
            if venc.tzinfo is None:
                venc = venc.replace(tzinfo=timezone.utc)
            diff = (venc - ahora).days
            dias_restantes = max(diff, 0)
            vencido = diff < 0

        tokens_data.append({
            "id": t.id,
            "codigo": t.codigo,
            "usado": t.usado,
            "fecha_creacion": t.fecha_creacion.isoformat() if t.fecha_creacion else None,
            "fecha_vencimiento": t.fecha_vencimiento.isoformat() if t.fecha_vencimiento else None,
            "dias_restantes": dias_restantes,
            "vencido": vencido,
        })

    vencidos = sum(1 for t in tokens_data if t["vencido"] and not t["usado"])

    return {
        "total": len(tokens),
        "disponibles": sum(1 for t in tokens if not t.usado),
        "usados": sum(1 for t in tokens if t.usado),
        "vencidos": vencidos,
        "tokens": tokens_data
    }

# --- 4. VER EMPRESAS REGISTRADAS ---
@router.get("/ver-empresas")
def listar_empresas(
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    empresas = db.query(models.Empresa).order_by(
        models.Empresa.id.desc()
    ).all()

    empresas_data = []
    for e in empresas:
        num_usuarios = len(e.usuarios) if e.usuarios else 0
        num_sucursales = len(e.sucursales) if e.sucursales else 0

        empresas_data.append({
            "id": e.id,
            "nombre_sas": e.nombre_sas,
            "nit": e.nit,
            "activa": e.activa,
            "fecha_registro": e.fecha_registro.isoformat() if e.fecha_registro else None,
            "num_usuarios": num_usuarios,
            "num_sucursales": num_sucursales,
        })

    return {
        "total": len(empresas),
        "activas": sum(1 for e in empresas if e.activa),
        "inactivas": sum(1 for e in empresas if not e.activa),
        "empresas": empresas_data
    }

# --- 5. ACTIVAR / DESACTIVAR EMPRESA ---
@router.patch("/empresa/{empresa_id}/toggle")
def toggle_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    empresa.activa = not empresa.activa
    db.commit()
    db.refresh(empresa)

    return {
        "mensaje": f"Empresa {'activada' if empresa.activa else 'desactivada'} correctamente",
        "empresa_id": empresa_id,
        "activa": empresa.activa
    }

# --- 6. ELIMINAR TOKEN NO USADO ---
@router.delete("/token/{token_id}")
def eliminar_token(
    token_id: int,
    db: Session = Depends(get_db),
    _=Depends(validar_master_key)
):
    token = db.query(models.TokenRegistro).filter(models.TokenRegistro.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token no encontrado")
    if token.usado:
        raise HTTPException(status_code=400, detail="No se puede eliminar un token ya usado")

    db.delete(token)
    db.commit()
    return {"mensaje": "Token eliminado correctamente"}