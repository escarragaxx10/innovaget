from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol
from datetime import datetime, timezone

router = APIRouter(prefix="/cajas", tags=["Control de Caja"])

# --- 1. APERTURA DE CAJA ---
@router.post("/abrir", response_model=schemas.CajaOut, status_code=status.HTTP_201_CREATED)
def abrir_caja(
    caja_data: schemas.CajaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    # ✅ Verificar que la sucursal pertenezca a la empresa del usuario
    sucursal = db.query(models.Sucursal).filter(
        models.Sucursal.id == caja_data.sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).first()

    if not sucursal:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta sucursal")

    # Verificar si ya existe una caja abierta en esta sucursal
    caja_abierta = db.query(models.Caja).filter(
        models.Caja.sucursal_id == caja_data.sucursal_id,
        models.Caja.estado == "ABIERTA"
    ).first()

    if caja_abierta:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una caja abierta en esta sucursal."
        )

    nueva_caja = models.Caja(
        sucursal_id=caja_data.sucursal_id,
        monto_inicial=caja_data.monto_inicial,
        estado="ABIERTA",
        fecha_apertura=datetime.now(timezone.utc)
    )

    # Asignación segura de responsable
    if current_user.role == "admin":
        nueva_caja.usuario_id = current_user.id
    else:
        nueva_caja.empleado_id = current_user.id

    try:
        db.add(nueva_caja)
        db.commit()
        db.refresh(nueva_caja)
        return nueva_caja
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al abrir caja: {str(e)}")


# --- 2. CIERRE DE CAJA ---
@router.post("/cerrar/{caja_id}")
def cerrar_caja(
    caja_id: int,
    efectivo_fisico_entregado: float,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    # Buscar la caja y validar que pertenezca a la empresa del usuario
    caja = db.query(models.Caja).join(models.Sucursal).filter(
        models.Caja.id == caja_id,
        models.Caja.estado == "ABIERTA",
        models.Sucursal.empresa_id == current_user.empresa_id  # ✅ Seguridad SaaS
    ).first()

    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada o ya cerrada.")

    # 1. Sumar ventas en efectivo de esta caja
    ventas_efectivo = db.query(func.sum(models.Venta.total)).filter(
        models.Venta.caja_id == caja_id,
        models.Venta.medio_pago == "Efectivo",
        models.Venta.estado == "COMPLETADA"  # ✅ No contar ventas anuladas
    ).scalar() or 0.0

    # 2. ✅ CORREGIDO: Descontar gastos en efectivo de esta caja
    gastos_caja = db.query(func.sum(models.Gasto.monto)).filter(
        models.Gasto.caja_id == caja_id
    ).scalar() or 0.0

    # 3. Cálculo de cuadre correcto
    # Esperado = lo que entró (inicial + ventas) - lo que salió (gastos)
    efectivo_esperado = (caja.monto_inicial or 0.0) + ventas_efectivo - gastos_caja  # ✅ CORREGIDO
    diferencia = efectivo_fisico_entregado - efectivo_esperado

    try:
        caja.monto_final = efectivo_fisico_entregado
        caja.fecha_cierre = datetime.now(timezone.utc)
        caja.estado = "CERRADA"

        db.commit()
        db.refresh(caja)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cerrar caja: {str(e)}")

    return {
        "mensaje": "Caja cerrada exitosamente",
        "detalle_cierre": {
            "caja_id": caja.id,
            "cerrado_por": getattr(current_user, "email", "Usuario"),
            "monto_inicial": caja.monto_inicial,
            "ventas_efectivo": float(ventas_efectivo),
            "gastos_caja": float(gastos_caja),          # ✅ NUEVO
            "total_esperado": float(efectivo_esperado),
            "real_entregado": float(efectivo_fisico_entregado),
            "diferencia": float(diferencia),
            "estado": "✅ Cuadre perfecto" if diferencia == 0 else (
                f"⚠️ Sobrante: ${diferencia:,.0f}" if diferencia > 0
                else f"❌ Faltante: ${abs(diferencia):,.0f}"
            )
        }
    }


# --- 3. VER CAJA ACTIVA DE UNA SUCURSAL ---
@router.get("/activa/{sucursal_id}", response_model=schemas.CajaOut)
def obtener_caja_activa(
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin", "cajero"]))
):
    caja = db.query(models.Caja).join(models.Sucursal).filter(
        models.Caja.sucursal_id == sucursal_id,
        models.Caja.estado == "ABIERTA",
        models.Sucursal.empresa_id == current_user.empresa_id  # ✅ Seguridad SaaS
    ).first()

    if not caja:
        raise HTTPException(status_code=404, detail="No hay caja abierta en esta sucursal")

    return caja


# --- 4. HISTORIAL DE CAJAS ---
@router.get("/historial/{sucursal_id}")
def historial_cajas(
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verificar_rol(["admin"]))
):
    cajas = db.query(models.Caja).join(models.Sucursal).filter(
        models.Caja.sucursal_id == sucursal_id,
        models.Sucursal.empresa_id == current_user.empresa_id
    ).order_by(models.Caja.fecha_apertura.desc()).all()

    return cajas