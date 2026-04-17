import os
import tempfile
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv

load_dotenv()

async def enviar_factura_email(
    destinatario: str,
    pdf_content: bytes,
    factura_id: int,
    nombre_cliente: str,
    nombre_empresa: str = "Innovagét ERP",
    mail_email: str = None,
    mail_password: str = None,
):
    # Usar credenciales de la empresa si están disponibles,
    # si no usar las del sistema (.env)
    correo_remitente = mail_email or os.getenv("MAIL_FROM")
    password_remitente = mail_password or os.getenv("MAIL_PASSWORD")
    usuario_smtp = mail_email or os.getenv("MAIL_USERNAME")

    conf = ConnectionConfig(
        MAIL_USERNAME=usuario_smtp,
        MAIL_PASSWORD=password_remitente,
        MAIL_FROM=correo_remitente,
        MAIL_FROM_NAME=nombre_empresa,
        MAIL_PORT=587,
        MAIL_SERVER="smtp.gmail.com",
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )

    tmp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf",
        prefix=f"factura_{factura_id}_"
    )
    try:
        tmp.write(pdf_content)
        tmp.close()

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #1f2937; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #14532d, #16a34a); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">{nombre_empresa}</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 13px;">
                        Sistema ERP Empresarial
                    </p>
                </div>

                <div style="background: #ffffff; padding: 28px; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="font-size: 16px;">Hola <strong>{nombre_cliente}</strong>,</p>
                    <p style="color: #6b7280;">Adjunto encontrarás tu factura de compra <strong>#{factura_id}</strong>.</p>

                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                        <p style="color: #16a34a; font-weight: bold; font-size: 18px; margin: 0;">
                            Factura #{factura_id}
                        </p>
                        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">
                            Documento adjunto en PDF
                        </p>
                    </div>

                    <p style="color: #6b7280; font-size: 14px;">
                        Gracias por tu compra. Si tienes alguna pregunta sobre tu factura,
                        no dudes en contactarnos.
                    </p>
                </div>

                <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2026 {nombre_empresa} · Todos los derechos reservados
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject=f"Factura #{factura_id} - {nombre_empresa}",
            recipients=[destinatario],
            body=html_body,
            subtype=MessageType.html,
            attachments=[tmp.name]
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"✅ Factura #{factura_id} enviada a {destinatario} desde {correo_remitente}")

    except Exception as e:
        print(f"❌ Error al enviar correo: {str(e)}")

    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)

# Agrega esta función a app/core/mailer.py

async def enviar_email_recuperacion(
    destinatario: str,
    token: str,
    nombre: str,
):
    import os
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
    
    # URL del frontend
    url_reset = f"http://localhost:5173/reset-password?token={token}"

    conf = ConnectionConfig(
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_FROM=os.getenv("MAIL_FROM"),
        MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Innovagét ERP"),
        MAIL_PORT=587,
        MAIL_SERVER="smtp.gmail.com",
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #14532d, #16a34a); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                    Innova<span style="color: #4ade80;">gét</span>
                </h1>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 13px;">
                    Recuperación de contraseña
                </p>
            </div>

            <div style="background: #ffffff; padding: 28px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px;">Hola <strong>{nombre}</strong>,</p>
                <p style="color: #6b7280;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Innovagét ERP.</p>

                <div style="text-align: center; margin: 28px 0;">
                    <a href="{url_reset}"
                        style="display: inline-block; padding: 14px 32px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        🔐 Restablecer contraseña
                    </a>
                </div>

                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #92400e;">
                        ⏰ <strong>Este enlace expira en 1 hora.</strong><br/>
                        Si no solicitaste restablecer tu contraseña, ignora este correo.
                    </p>
                </div>

                <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
                    <span style="color: #16a34a; word-break: break-all;">{url_reset}</span>
                </p>
            </div>

            <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © 2026 Innovagét ERP · Todos los derechos reservados
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        message = MessageSchema(
            subject="Recuperación de contraseña - Innovagét ERP",
            recipients=[destinatario],
            body=html_body,
            subtype=MessageType.html,
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"✅ Email de recuperación enviado a {destinatario}")
    except Exception as e:
        print(f"❌ Error al enviar email de recuperación: {str(e)}")