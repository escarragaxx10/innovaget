from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.security import verificar_rol

router = APIRouter(prefix="/dashboard", tags=["Dashboard / Estadísticas"])

@router.get("/", response_model=schemas.DashboardStats)
def obtener_metricas_empresa(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    hoy = datetime.now(timezone.utc).date()

    # 1. Ventas totales del día — ✅ CORREGIDO: filtra por estado COMPLETADA
    ventas_hoy = db.query(func.sum(models.Venta.total)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == hoy,
        models.Venta.estado == "COMPLETADA"
    ).scalar() or 0.0

    # 2. Número de operaciones del día — ✅ CORREGIDO: también filtra por COMPLETADA
    num_ventas = db.query(func.count(models.Venta.id)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == hoy,
        models.Venta.estado == "COMPLETADA"  # ✅ antes no filtraba por estado
    ).scalar() or 0

    # 3. Alertas de inventario (stock bajo en cualquier sede)
    alertas = db.query(func.count(models.Producto.id)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        models.Producto.stock <= 5
    ).scalar() or 0

    # 4. Total clientes registrados en la empresa
    total_clientes = db.query(func.count(models.Cliente.id)).filter(
        models.Cliente.empresa_id == current_user.empresa_id
    ).scalar() or 0

    # 5. ✅ NUEVO: Obtener nombre de la empresa para el frontend
    empresa = db.query(models.Empresa).filter(
        models.Empresa.id == current_user.empresa_id
    ).first()
    nombre_empresa = empresa.nombre_sas if empresa else "Mi Empresa"

    return {
        "ventas_diarias": float(ventas_hoy),
        "numero_operaciones": int(num_ventas),
        "alertas_inventario": int(alertas),
        "total_clientes": int(total_clientes),
        "nombre_empresa": nombre_empresa,   # ✅ NUEVO
        "moneda": "COP",
        "ultimo_refresco": datetime.now(timezone.utc).strftime("%H:%M:%S")  # ✅ timezone correcto
    }