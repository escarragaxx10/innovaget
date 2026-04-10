from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from xhtml2pdf import pisa
from io import BytesIO
from app.database import get_db
from app.models import models
from app.core.security import verificar_rol

router = APIRouter(prefix="/reportes", tags=["Panel de Control (Dueño)"])

# --- 1. RESUMEN DIARIO POR MEDIO DE PAGO ---
@router.get("/resumen-diario")
def obtener_resumen_ejecutivo(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    hoy = datetime.now(timezone.utc).date()

    ventas_hoy = db.query(
        models.Venta.medio_pago,
        func.sum(models.Venta.total).label("total")
    ).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == hoy,
        models.Venta.estado == "COMPLETADA"  # ✅ Solo ventas completadas
    ).group_by(models.Venta.medio_pago).all()

    resumen_ventas = {v.medio_pago: float(v.total) for v in ventas_hoy}

    # ✅ Gastos del día
    gastos_hoy = db.query(func.sum(models.Gasto.monto)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Gasto.fecha) == hoy
    ).scalar() or 0.0

    total_ventas = sum(resumen_ventas.values())

    return {
        "fecha": str(hoy),
        "dinero_hoy": {
            "efectivo": resumen_ventas.get("Efectivo", 0.0),
            "transferencias": resumen_ventas.get("Transferencia", 0.0),
            "otros": resumen_ventas.get("Otro", 0.0),
            "total_ventas": total_ventas,
            "gastos_operativos": float(gastos_hoy),       # ✅ NUEVO
            "utilidad_dia": total_ventas - float(gastos_hoy)  # ✅ NUEVO
        }
    }

# --- 2. UTILIDAD MENSUAL ---
@router.get("/utilidad-mensual")
def reporte_utilidad_mensual(
    mes: int = None,
    anio: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    ahora = datetime.now(timezone.utc)
    mes = mes or ahora.month
    anio = anio or ahora.year

    # Ingresos y costos de mercancía
    detalles = db.query(
        models.DetalleVenta,
        models.Producto.precio_compra
    ).join(models.Venta).join(models.Producto).join(
        models.Sucursal, models.Venta.sucursal_id == models.Sucursal.id
    ).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        models.Venta.estado == "COMPLETADA",
        func.extract("month", models.Venta.fecha) == mes,
        func.extract("year", models.Venta.fecha) == anio
    ).all()

    ingresos = sum(d.DetalleVenta.cantidad * d.DetalleVenta.precio_unitario for d in detalles)
    costos = sum(d.DetalleVenta.cantidad * d.precio_compra for d in detalles)

    # Gastos operativos del mes
    gastos_mes = db.query(func.sum(models.Gasto.monto)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.extract("month", models.Gasto.fecha) == mes,
        func.extract("year", models.Gasto.fecha) == anio  # ✅ CORREGIDO: faltaba filtro de año
    ).scalar() or 0.0

    ganancia_bruta = ingresos - costos
    ganancia_real = ganancia_bruta - gastos_mes

    return {
        "periodo": f"{mes}/{anio}",
        "balance": {
            "ingresos": float(ingresos),
            "costos_mercancia": float(costos),
            "ganancia_bruta": float(ganancia_bruta),      # ✅ NUEVO
            "gastos_operativos": float(gastos_mes),
            "ganancia_real": float(ganancia_real)
        }
    }

# --- 3. VENTAS POR SUCURSAL ---
@router.get("/ventas-por-sucursal")
def ventas_por_sucursal(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin", "gerente"]))
):
    # ✅ NUEVO: Reporte útil para comparar rendimiento entre sedes
    hoy = datetime.now(timezone.utc).date()

    resultados = db.query(
        models.Sucursal.nombre,
        func.count(models.Venta.id).label("num_ventas"),
        func.sum(models.Venta.total).label("total_ventas")
    ).join(models.Venta, models.Venta.sucursal_id == models.Sucursal.id).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == hoy,
        models.Venta.estado == "COMPLETADA"
    ).group_by(models.Sucursal.nombre).all()

    return {
        "fecha": str(hoy),
        "sucursales": [
            {
                "nombre": r.nombre,
                "num_ventas": r.num_ventas,
                "total_ventas": float(r.total_ventas or 0)
            }
            for r in resultados
        ]
    }

# --- 4. INFORME PDF ---
@router.get("/descargar-pdf")
def generar_informe_pdf(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    hoy = datetime.now(timezone.utc).date()

    ventas = db.query(models.Venta).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == hoy,
        models.Venta.estado == "COMPLETADA"  # ✅ Solo completadas
    ).all()

    total_v = sum(v.total for v in ventas)
    num_ventas = len(ventas)

    # Obtener nombre de empresa
    empresa = db.query(models.Empresa).filter(
        models.Empresa.id == current_user.empresa_id
    ).first()
    nombre_empresa = empresa.nombre_sas if empresa else "Mi Empresa"

    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #2c3e50; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background-color: #2c3e50; color: white; padding: 8px; }}
            td {{ padding: 8px; border-bottom: 1px solid #ddd; }}
            .total {{ font-weight: bold; font-size: 18px; color: #27ae60; }}
        </style>
    </head>
    <body>
        <h1>{nombre_empresa} — Reporte del {hoy}</h1>
        <p>Generado por: {current_user.email}</p>
        <hr/>
        <p>Número de ventas: <strong>{num_ventas}</strong></p>
        <p class="total">Total del día: ${total_v:,.0f} COP</p>
    </body>
    </html>
    """

    output = BytesIO()
    pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), output)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_{hoy}.pdf"}
    )