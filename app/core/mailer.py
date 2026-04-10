import smtplib
from email.message import EmailMessage

def enviar_factura_email(destinatario: str, pdf_content: bytes, factura_id: int, nombre_cliente: str):
    msg = EmailMessage()
    msg['Subject'] = f"Factura Innovagué #{factura_id} - ¡Gracias por tu compra!"
    msg['From'] = "tu-correo@gmail.com" # Cambia esto
    msg['To'] = destinatario
    
    msg.set_content(f"Hola {nombre_cliente},\n\nAdjunto enviamos tu factura por tu compra de hoy.\n\n¡Gracias por elegir Innovagué!")

    msg.add_attachment(
        pdf_content,
        maintype='application',
        subtype='pdf',
        filename=f"Factura_{factura_id}.pdf"
    )

    # Configuración para Gmail
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login("tu-correo@gmail.com", "tu-clave-de-aplicacion") # Cambia esto
            server.send_message(msg)
    except Exception as e:
        print(f"Error enviando correo: {e}")