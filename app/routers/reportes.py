from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, date
from zoneinfo import ZoneInfo
from xhtml2pdf import pisa
from io import BytesIO
from app.database import get_db
from app.models import models
from app.core.security import verificar_rol
from typing import Optional

router = APIRouter(prefix="/reportes", tags=["Panel de Control (Dueño)"])

BOGOTA = ZoneInfo("America/Bogota")

# --- 1. RESUMEN DIARIO POR MEDIO DE PAGO ---
@router.get("/resumen-diario")
def obtener_resumen_ejecutivo(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    hoy = datetime.now(BOGOTA).date()

    ventas_hoy = db.query(
        models.Venta.medio_pago,
        func.sum(models.Venta.total).label("total")
    ).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == hoy,
        models.Venta.estado == "COMPLETADA"
    ).group_by(models.Venta.medio_pago).all()

    resumen_ventas = {v.medio_pago: float(v.total) for v in ventas_hoy}

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
            "gastos_operativos": float(gastos_hoy),
            "utilidad_dia": total_ventas - float(gastos_hoy)
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
    ahora = datetime.now(BOGOTA)
    mes = mes or ahora.month
    anio = anio or ahora.year

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

    gastos_mes = db.query(func.sum(models.Gasto.monto)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.extract("month", models.Gasto.fecha) == mes,
        func.extract("year", models.Gasto.fecha) == anio
    ).scalar() or 0.0

    ganancia_bruta = ingresos - costos
    ganancia_real = ganancia_bruta - gastos_mes

    return {
        "periodo": f"{mes}/{anio}",
        "balance": {
            "ingresos": float(ingresos),
            "costos_mercancia": float(costos),
            "ganancia_bruta": float(ganancia_bruta),
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
    hoy = datetime.now(BOGOTA).date()

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

# --- 4. PDF DIARIO ---
@router.get("/descargar-pdf-diario")
def generar_pdf_diario(
    fecha: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    if fecha:
        fecha_reporte = date.fromisoformat(fecha)
    else:
        fecha_reporte = datetime.now(BOGOTA).date()

    empresa = db.query(models.Empresa).filter(models.Empresa.id == current_user.empresa_id).first()
    nombre_empresa = empresa.nombre_sas if empresa else "Mi Empresa"
    nit_empresa = empresa.nit if empresa else "---"

    ventas = db.query(models.Venta).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Venta.fecha) == fecha_reporte,
        models.Venta.estado == "COMPLETADA"
    ).order_by(models.Venta.fecha.desc()).all()

    total_v = sum(v.total for v in ventas)
    num_ventas = len(ventas)
    efectivo = sum(v.total for v in ventas if v.medio_pago == "Efectivo")
    transferencia = sum(v.total for v in ventas if v.medio_pago == "Transferencia")
    otros = sum(v.total for v in ventas if v.medio_pago not in ["Efectivo", "Transferencia"])

    gastos = db.query(func.sum(models.Gasto.monto)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.date(models.Gasto.fecha) == fecha_reporte
    ).scalar() or 0.0

    utilidad = total_v - float(gastos)

    filas_ventas = ""
    for v in ventas:
        cliente_nombre = v.cliente.nombre if v.cliente else "Consumidor Final"
        hora = v.fecha.strftime('%H:%M') if v.fecha else "---"
        filas_ventas += f"""
        <tr>
            <td>#{v.id}</td>
            <td>{hora}</td>
            <td>{cliente_nombre}</td>
            <td>{v.medio_pago}</td>
            <td style="text-align:right; font-weight:bold;">${v.total:,.0f}</td>
        </tr>
        """

    fecha_generacion = datetime.now(BOGOTA).strftime('%d/%m/%Y %H:%M')
    css = _get_css()

    html_content = f"""
    <html><head><meta charset="UTF-8"/><style>{css}</style></head>
    <body>
        <div class="header">
            <div class="header-top">
                <div>
                    <div class="empresa-nombre">{nombre_empresa}</div>
                    <div class="empresa-info">NIT: {nit_empresa}</div>
                </div>
                <div class="reporte-badge">
                    <div class="reporte-badge-label">Reporte diario</div>
                    <div class="reporte-badge-val">{fecha_reporte.strftime('%d/%m/%Y')}</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:2px;">Generado por: {current_user.email}</div>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box"><div class="stat-label">Total ventas</div><div class="stat-value">{num_ventas}</div></div>
            <div class="stat-box"><div class="stat-label">Ingresos del dia</div><div class="stat-value verde">${total_v:,.0f}</div></div>
            <div class="stat-box"><div class="stat-label">Gastos operativos</div><div class="stat-value rojo">${gastos:,.0f}</div></div>
            <div class="stat-box"><div class="stat-label">Utilidad del dia</div><div class="stat-value {'verde' if utilidad >= 0 else 'rojo'}">${utilidad:,.0f}</div></div>
        </div>

        <div class="section-title">Resumen por medio de pago</div>
        <div class="resumen-pagos">
            <div class="pago-box"><div class="pago-label">Efectivo</div><div class="pago-val">${efectivo:,.0f}</div></div>
            <div class="pago-box"><div class="pago-label">Transferencia</div><div class="pago-val">${transferencia:,.0f}</div></div>
            <div class="pago-box"><div class="pago-label">Otros</div><div class="pago-val">${otros:,.0f}</div></div>
        </div>

        <div class="section-title">Detalle de ventas</div>
        {'<p style="color:#9ca3af;font-size:12px;">No hubo ventas en esta fecha.</p>' if not ventas else f"""
        <table>
            <thead><tr>
                <th style="width:8%;">Fact.</th>
                <th style="width:10%;">Hora</th>
                <th style="width:40%;">Cliente</th>
                <th style="width:20%;">Pago</th>
                <th style="width:22%;text-align:right;">Total</th>
            </tr></thead>
            <tbody>{filas_ventas}</tbody>
        </table>
        """}

        <div class="footer">
            <p>{nombre_empresa} | NIT: {nit_empresa} | Generado el {fecha_generacion}</p>
            <p style="margin-top:4px;">Documento generado por el sistema Innovaget ERP</p>
        </div>
    </body></html>
    """

    output = BytesIO()
    pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), output)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_diario_{nombre_empresa}_{fecha_reporte}.pdf"}
    )

# --- 5. PDF MENSUAL ---
@router.get("/descargar-pdf-mensual")
def generar_pdf_mensual(
    mes: int,
    anio: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verificar_rol(["admin"]))
):
    empresa = db.query(models.Empresa).filter(models.Empresa.id == current_user.empresa_id).first()
    nombre_empresa = empresa.nombre_sas if empresa else "Mi Empresa"
    nit_empresa = empresa.nit if empresa else "---"

    ventas = db.query(models.Venta).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.extract("month", models.Venta.fecha) == mes,
        func.extract("year", models.Venta.fecha) == anio,
        models.Venta.estado == "COMPLETADA"
    ).order_by(models.Venta.fecha.desc()).all()

    total_v = sum(v.total for v in ventas)
    num_ventas = len(ventas)
    efectivo = sum(v.total for v in ventas if v.medio_pago == "Efectivo")
    transferencia = sum(v.total for v in ventas if v.medio_pago == "Transferencia")
    otros = sum(v.total for v in ventas if v.medio_pago not in ["Efectivo", "Transferencia"])

    detalles = db.query(
        models.DetalleVenta, models.Producto.precio_compra
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

    gastos_mes = db.query(func.sum(models.Gasto.monto)).join(models.Sucursal).filter(
        models.Sucursal.empresa_id == current_user.empresa_id,
        func.extract("month", models.Gasto.fecha) == mes,
        func.extract("year", models.Gasto.fecha) == anio
    ).scalar() or 0.0

    ganancia_bruta = ingresos - costos
    ganancia_real = ganancia_bruta - float(gastos_mes)

    meses_nombres = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
    nombre_mes = meses_nombres[mes]

    filas_ventas = ""
    for v in ventas:
        cliente_nombre = v.cliente.nombre if v.cliente else "Consumidor Final"
        fecha_str = v.fecha.strftime('%d/%m') if v.fecha else "---"
        hora = v.fecha.strftime('%H:%M') if v.fecha else "---"
        filas_ventas += f"""
        <tr>
            <td>#{v.id}</td>
            <td>{fecha_str} {hora}</td>
            <td>{cliente_nombre}</td>
            <td>{v.medio_pago}</td>
            <td style="text-align:right;font-weight:bold;">${v.total:,.0f}</td>
        </tr>
        """

    fecha_generacion = datetime.now(BOGOTA).strftime('%d/%m/%Y %H:%M')
    css = _get_css()

    html_content = f"""
    <html><head><meta charset="UTF-8"/><style>{css}</style></head>
    <body>
        <div class="header">
            <div class="header-top">
                <div>
                    <div class="empresa-nombre">{nombre_empresa}</div>
                    <div class="empresa-info">NIT: {nit_empresa}</div>
                </div>
                <div class="reporte-badge">
                    <div class="reporte-badge-label">Reporte mensual</div>
                    <div class="reporte-badge-val">{nombre_mes} {anio}</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:2px;">Generado por: {current_user.email}</div>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box"><div class="stat-label">Total ventas</div><div class="stat-value">{num_ventas}</div></div>
            <div class="stat-box"><div class="stat-label">Ingresos</div><div class="stat-value verde">${ingresos:,.0f}</div></div>
            <div class="stat-box"><div class="stat-label">Costos mercancia</div><div class="stat-value rojo">${costos:,.0f}</div></div>
            <div class="stat-box"><div class="stat-label">Ganancia real</div><div class="stat-value {'verde' if ganancia_real >= 0 else 'rojo'}">${ganancia_real:,.0f}</div></div>
        </div>

        <div class="section-title">Balance del mes</div>
        <div class="resumen-pagos">
            <div class="pago-box"><div class="pago-label">Ganancia bruta</div><div class="pago-val">${ganancia_bruta:,.0f}</div></div>
            <div class="pago-box"><div class="pago-label">Gastos operativos</div><div class="pago-val">${gastos_mes:,.0f}</div></div>
            <div class="pago-box"><div class="pago-label">Ganancia real</div><div class="pago-val" style="color:{'#16a34a' if ganancia_real >= 0 else '#dc2626'}">${ganancia_real:,.0f}</div></div>
        </div>

        <div class="section-title">Resumen por medio de pago</div>
        <div class="resumen-pagos">
            <div class="pago-box"><div class="pago-label">Efectivo</div><div class="pago-val">${efectivo:,.0f}</div></div>
            <div class="pago-box"><div class="pago-label">Transferencia</div><div class="pago-val">${transferencia:,.0f}</div></div>
            <div class="pago-box"><div class="pago-label">Otros</div><div class="pago-val">${otros:,.0f}</div></div>
        </div>

        <div class="section-title">Detalle de ventas del mes</div>
        {'<p style="color:#9ca3af;font-size:12px;">No hubo ventas este mes.</p>' if not ventas else f"""
        <table>
            <thead><tr>
                <th style="width:8%;">Fact.</th>
                <th style="width:15%;">Fecha/Hora</th>
                <th style="width:37%;">Cliente</th>
                <th style="width:18%;">Pago</th>
                <th style="width:22%;text-align:right;">Total</th>
            </tr></thead>
            <tbody>{filas_ventas}</tbody>
        </table>
        """}

        <div class="footer">
            <p>{nombre_empresa} | NIT: {nit_empresa} | Generado el {fecha_generacion}</p>
            <p style="margin-top:4px;">Documento generado por el sistema Innovaget ERP</p>
        </div>
    </body></html>
    """

    output = BytesIO()
    pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), output)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_mensual_{nombre_empresa}_{nombre_mes}_{anio}.pdf"}
    )

def _get_css():
    return """
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; padding: 30px; }
        .header { background-color: #14532d; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .empresa-nombre { font-size: 22px; font-weight: bold; color: white; }
        .empresa-info { font-size: 10px; color: rgba(255,255,255,0.8); margin-top: 4px; }
        .reporte-badge { background: rgba(255,255,255,0.15); padding: 8px 14px; border-radius: 6px; text-align: right; }
        .reporte-badge-label { font-size: 9px; color: rgba(255,255,255,0.7); text-transform: uppercase; }
        .reporte-badge-val { font-size: 16px; font-weight: bold; color: white; }
        .stats-grid { display: flex; gap: 12px; margin-bottom: 20px; }
        .stat-box { flex: 1; padding: 14px 16px; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
        .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 4px; }
        .stat-value { font-size: 18px; font-weight: bold; color: #14532d; }
        .stat-value.rojo { color: #dc2626; }
        .stat-value.verde { color: #16a34a; }
        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; font-weight: bold; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #16a34a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead tr { background-color: #f0fdf4; }
        thead th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #16a34a; border-bottom: 2px solid #16a34a; }
        tbody td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        .resumen-pagos { display: flex; gap: 12px; margin-bottom: 20px; }
        .pago-box { flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .pago-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
        .pago-val { font-size: 14px; font-weight: bold; color: #111827; }
        .footer { background: #f9fafb; border-top: 2px solid #e5e7eb; padding: 12px 0; text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; }
    """