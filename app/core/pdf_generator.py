from xhtml2pdf import pisa
from io import BytesIO

def generar_pdf_factura(venta, empresa):
    
    # Detalles de productos
    filas_productos = ""
    for d in venta.detalles:
        nombre = d.producto.nombre if d.producto else f"Producto #{d.producto_id}"
        filas_productos += f"""
        <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">{d.cantidad}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">{nombre}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${d.precio_unitario:,.0f}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${d.subtotal:,.0f}</td>
        </tr>
        """

    # Descuento
    descuento_html = ""
    if hasattr(venta, 'descuento_porcentaje') and venta.descuento_porcentaje and venta.descuento_porcentaje > 0:
        descuento_val = venta.total / (1 - venta.descuento_porcentaje / 100) * (venta.descuento_porcentaje / 100)
        descuento_html = f"""
        <tr>
            <td colspan="2" style="padding: 6px 10px; text-align: right; color: #f59e0b;">Descuento ({venta.descuento_porcentaje}%):</td>
            <td style="padding: 6px 10px; text-align: right; color: #f59e0b;">-${descuento_val:,.0f}</td>
        </tr>
        """
    elif hasattr(venta, 'descuento_valor') and venta.descuento_valor and venta.descuento_valor > 0:
        descuento_html = f"""
        <tr>
            <td colspan="2" style="padding: 6px 10px; text-align: right; color: #f59e0b;">Descuento:</td>
            <td style="padding: 6px 10px; text-align: right; color: #f59e0b;">-${venta.descuento_valor:,.0f}</td>
        </tr>
        """

    # Cambio
    cambio_html = ""
    if hasattr(venta, 'cambio') and venta.cambio and venta.cambio > 0:
        cambio_html = f"""
        <tr>
            <td colspan="2" style="padding: 6px 10px; text-align: right; color: #6b7280;">Pago con:</td>
            <td style="padding: 6px 10px; text-align: right; color: #6b7280;">${venta.pago_con:,.0f}</td>
        </tr>
        <tr>
            <td colspan="2" style="padding: 6px 10px; text-align: right; color: #6b7280;">Cambio:</td>
            <td style="padding: 6px 10px; text-align: right; color: #6b7280;">${venta.cambio:,.0f}</td>
        </tr>
        """

    # Datos empresa
    nombre_empresa = empresa.nombre_sas if empresa else "Mi Empresa"
    nit_empresa = empresa.nit if empresa else "---"

    # Cliente
    nombre_cliente = "Consumidor Final"
    cedula_cliente = "---"
    if venta.cliente:
        nombre_cliente = venta.cliente.nombre
        cedula_cliente = venta.cliente.cedula_nit

    fecha_str = venta.fecha.strftime('%d/%m/%Y %H:%M') if venta.fecha else "---"

    html_content = f"""
    <html>
    <head>
        <meta charset="UTF-8"/>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; background: #fff; }}
            .header {{
                background-color: #14532d;
                color: white;
                padding: 20px 24px;
                margin-bottom: 0;
            }}
            .header-top {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            }}
            .empresa-nombre {{
                font-size: 22px;
                font-weight: bold;
                letter-spacing: 1px;
                color: white;
            }}
            .empresa-info {{ font-size: 10px; color: rgba(255,255,255,0.8); margin-top: 4px; }}
            .factura-num {{
                text-align: right;
                background: rgba(255,255,255,0.15);
                padding: 8px 14px;
                border-radius: 6px;
            }}
            .factura-num-label {{ font-size: 9px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; }}
            .factura-num-val {{ font-size: 20px; font-weight: bold; color: white; }}
            .info-section {{
                display: flex;
                gap: 0;
                margin: 0;
            }}
            .info-box {{
                flex: 1;
                padding: 14px 20px;
                border-bottom: 2px solid #e5e7eb;
            }}
            .info-box:first-child {{ border-right: 1px solid #e5e7eb; }}
            .info-title {{
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #16a34a;
                font-weight: bold;
                margin-bottom: 6px;
            }}
            .info-val {{ font-size: 12px; color: #111827; margin-bottom: 3px; }}
            .info-sub {{ font-size: 10px; color: #6b7280; }}
            .productos-section {{ padding: 16px 20px; }}
            .productos-title {{
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #16a34a;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            table {{ width: 100%; border-collapse: collapse; }}
            thead tr {{ background: #f0fdf4; }}
            thead th {{
                padding: 8px 10px;
                text-align: left;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #16a34a;
                border-bottom: 2px solid #16a34a;
            }}
            thead th:last-child, thead th:nth-child(3) {{ text-align: right; }}
            .totales-section {{ padding: 0 20px 16px; }}
            .totales-table {{ width: 100%; border-collapse: collapse; margin-left: auto; }}
            .totales-table td {{ padding: 4px 10px; font-size: 11px; }}
            .total-final td {{
                padding: 10px;
                background-color: #052e16;
                color: white;
                font-size: 14px;
                font-weight: bold;
            }}
            .total-final td:last-child {{ text-align: right; color: #4ade80; font-size: 16px; }}
            .footer {{
                background: #f9fafb;
                border-top: 2px solid #e5e7eb;
                padding: 12px 20px;
                text-align: center;
                font-size: 10px;
                color: #6b7280;
            }}
            .footer strong {{ color: #16a34a; }}
            .estado-badge {{
                display: inline-block;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 9px;
                font-weight: bold;
                background: #f0fdf4;
                color: #16a34a;
                border: 1px solid #16a34a;
            }}
        </style>
    </head>
    <body>

        <!-- HEADER -->
        <div class="header">
            <div class="header-top">
                <div>
                    <div class="empresa-nombre">{nombre_empresa}</div>
                    <div class="empresa-info">NIT: {nit_empresa}</div>
                </div>
                <div class="factura-num">
                    <div class="factura-num-label">Factura No.</div>
                    <div class="factura-num-val">{str(venta.id).zfill(6)}</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.7); margin-top: 2px;">{fecha_str}</div>
                </div>
            </div>
        </div>

        <!-- INFO CLIENTE Y VENTA -->
        <div class="info-section">
            <div class="info-box">
                <div class="info-title">Datos del cliente</div>
                <div class="info-val"><strong>{nombre_cliente}</strong></div>
                <div class="info-sub">Cedula/NIT: {cedula_cliente}</div>
            </div>
            <div class="info-box">
                <div class="info-title">Datos de pago</div>
                <div class="info-val"><strong>{venta.medio_pago}</strong></div>
                <div class="info-sub">Estado: <span class="estado-badge">{venta.estado}</span></div>
            </div>
        </div>

        <!-- PRODUCTOS -->
        <div class="productos-section">
            <div class="productos-title">Detalle de productos</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 8%;">Cant.</th>
                        <th style="width: 50%;">Producto</th>
                        <th style="width: 21%; text-align: right;">Precio Unit.</th>
                        <th style="width: 21%; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {filas_productos}
                </tbody>
            </table>
        </div>

        <!-- TOTALES -->
        <div class="totales-section">
            <table class="totales-table">
                <tbody>
                    {descuento_html}
                    {cambio_html}
                </tbody>
                <tbody>
                    <tr class="total-final">
                        <td>TOTAL PAGADO</td>
                        <td style="text-align: right; color: #4ade80; font-size: 16px; font-weight: bold;">${venta.total:,.0f} COP</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p><strong>Gracias por elegir {nombre_empresa}</strong></p>
            <p style="margin-top: 4px;">Este documento es una factura electronica generada por {nombre_empresa}</p>
            <p style="margin-top: 4px; color: #9ca3af;">Fecha de emision: {fecha_str}</p>
        </div>

    </body>
    </html>
    """

    result = BytesIO()
    pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
    return result.getvalue()