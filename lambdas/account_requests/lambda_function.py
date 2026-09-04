import json
import uuid
import boto3
from botocore.exceptions import ClientError

from shared.db import get_connection
from shared.utils import (
    success,
    bad_request,
    server_error
)

# 💡 CONFIGURACIÓN
ADMIN_EMAIL = "noreply@snbrepresentaciones.com.ar"
AWS_REGION = "sa-east-1"

ses_client = boto3.client('ses', region_name=AWS_REGION)

# URLs del portal (ajustá si cambian)
ADMIN_PANEL_URL = "https://snbrepresentaciones.com.ar/admin"
LOGIN_URL = "https://snbrepresentaciones.com.ar/login"
LOGO_URL = "https://snbrepresentaciones.com.ar/logo-share.png"


def send_admin_notification(full_name, business_name, email, phone):
    """Envía un email HTML profesional al administrador."""
    subject = "Nueva solicitud de cuenta B2B - SNB Representaciones"
    
    body_html = f"""<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:20px 0;">
        <img src="{LOGO_URL}" alt="SNB" style="max-width:200px;">
    </div>
    <h2 style="color:#6b1426;">Nueva solicitud de cuenta B2B</h2>
    <p>Has recibido una nueva solicitud de registro en el portal.</p>
    
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="background:#f5f5f5;">
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Nombre</td>
            <td style="padding:10px;border:1px solid #ddd;">{full_name}</td>
        </tr>
        <tr>
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Empresa</td>
            <td style="padding:10px;border:1px solid #ddd;">{business_name}</td>
        </tr>
        <tr style="background:#f5f5f5;">
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Email</td>
            <td style="padding:10px;border:1px solid #ddd;">{email}</td>
        </tr>
        <tr>
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Teléfono</td>
            <td style="padding:10px;border:1px solid #ddd;">{phone}</td>
        </tr>
    </table>
    
    <div style="text-align:center;margin:30px 0;">
        <a href="{ADMIN_PANEL_URL}" style="background:#6b1426;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;">
            Ir al panel de administrador
        </a>
    </div>
    
    <hr style="border:none;border-top:1px solid #ddd;margin:30px 0;">
    <p style="font-size:12px;color:#666;text-align:center;">
        SNB Representaciones - Sistema B2B<br>
        Este es un email automático, no respondas a esta dirección.
    </p>
</body>
</html>"""

    try:
        ses_client.send_email(
            Source=ADMIN_EMAIL,
            Destination={'ToAddresses': [ADMIN_EMAIL]},
            Message={
                'Subject': {'Data': subject},
                'Body': {'Html': {'Data': body_html}}
            }
        )
        print("Notificación al admin enviada con éxito.")
    except ClientError as e:
        print("ERROR SES (admin):", e.response['Error']['Message'])


def send_user_confirmation(full_name, email):
    """Envía email de confirmación al usuario que solicitó la cuenta."""
    subject = "Solicitud recibida - SNB Representaciones"
    
    body_html = f"""<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:20px 0;">
        <img src="{LOGO_URL}" alt="SNB" style="max-width:200px;">
    </div>
    <h2 style="color:#6b1426;">¡Hola {full_name}!</h2>
    <p>Hemos recibido tu solicitud para crear una cuenta en el <strong>portal B2B de SNB Representaciones</strong>.</p>
    
    <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;">
        <p style="margin:5px 0;">Tu solicitud está siendo revisada por nuestro equipo.</p>
        <p style="margin:5px 0;">Te enviaremos un email cuando tu cuenta esté aprobada y lista para usar.</p>
    </div>
    
    <p style="text-align:center;">Este proceso suele tomar menos de 24 horas.</p>
    
    <div style="text-align:center;margin:30px 0;">
        <a href="{LOGIN_URL}" style="background:#6b1426;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;">
            Ir al portal
        </a>
    </div>
    
    <hr style="border:none;border-top:1px solid #ddd;margin:30px 0;">
    <p style="font-size:12px;color:#666;text-align:center;">
        SNB Representaciones - Sistema B2B<br>
        Este es un email automático, no respondas a esta dirección.
    </p>
</body>
</html>"""

    try:
        ses_client.send_email(
            Source=ADMIN_EMAIL,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': subject},
                'Body': {'Html': {'Data': body_html}}
            }
        )
        print("Confirmación al usuario enviada con éxito.")
    except ClientError as e:
        print("ERROR SES (usuario):", e.response['Error']['Message'])


def create_request(body):
    full_name = body.get("full_name")
    email = body.get("email")
    phone = body.get("phone")
    business_name = body.get("business_name")

    # Obligatorios
    if not full_name:
        return bad_request("full_name es requerido")
    if not email:
        return bad_request("email es requerido")
    if not phone:
        return bad_request("phone es requerido")
    if not business_name:
        return bad_request("business_name es requerido")

    conn = get_connection()
    cur = conn.cursor()

    try:
        request_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO account_requests (
                id, full_name, email, phone, business_name,
                delivery_method, carrier_name, carrier_phone, delivery_address,
                mail_adicional, telefono_oficina, telefono_adicional,
                cuit, condicion_fiscal, direccion, ciudad, provincia, direccion_transporte
            )
            VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )
            """,
            (
                request_id,
                full_name,
                email,
                phone,
                business_name,
                body.get("delivery_method"),
                body.get("carrier_name"),
                body.get("carrier_phone"),
                body.get("delivery_address"),
                body.get("mail_adicional"),
                body.get("telefono_oficina"),
                body.get("telefono_adicional"),
                body.get("cuit"),
                body.get("condicion_fiscal"),
                body.get("direccion"),
                body.get("ciudad"),
                body.get("provincia"),
                body.get("direccion_transporte")
            )
        )

        conn.commit()

        # Enviar notificaciones (no fallan la solicitud si el email falla)
        send_admin_notification(full_name, business_name, email, phone)
        send_user_confirmation(full_name, email)

        return success({
            "message": "Solicitud enviada"
        })

    except Exception as e:
        conn.rollback()
        print("ACCOUNT REQUEST ERROR")
        print(str(e))
        return server_error()

    finally:
        cur.close()
        conn.close()


def reject_request(request_id):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM account_requests WHERE id = %s", [request_id])
        conn.commit()
        return success({"message": "Solicitud rechazada correctamente"})
    except Exception as e:
        conn.rollback()
        return server_error()
    finally:
        cur.close()
        conn.close()


def handler(event, context):
    try:
        path = event["requestContext"]["http"]["path"]
        method = event["requestContext"]["http"]["method"]

        # CORS
        if method == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "*"
                },
                "body": ""
            }

        body = json.loads(event.get("body") or "{}")

        if method == "POST" and path == "/account-requests":
            return create_request(body)

        if method == "POST" and "/reject" in path:
            parts = path.split('/')
            request_id = parts[3]
            return reject_request(request_id)
    
        return bad_request("Ruta inválida")

    except Exception as e:
        print("HANDLER ERROR")
        print(str(e))
        return server_error()