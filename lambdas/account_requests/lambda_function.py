import json
import uuid
import boto3 # 💡 IMPORTANTE: Importamos boto3 para usar SES
from botocore.exceptions import ClientError

from shared.db import get_connection
from shared.utils import (
    success,
    bad_request,
    server_error
)

# 💡 CONFIGURACIÓN DE SES
# Reemplazá esto por el correo que vas a usar en AWS y tu región
ADMIN_EMAIL = "tu_correo@dominio.com" 
AWS_REGION = "us-east-1" 

ses_client = boto3.client('ses', region_name=AWS_REGION)

def send_admin_notification(full_name, business_name, email, phone):
    """Envía un email al administrador avisando de la nueva solicitud."""
    subject = "Nueva solicitud de cuenta B2B"
    body_text = f"""Has recibido una nueva solicitud de cuenta:

Nombre: {full_name}
Empresa: {business_name}
Email: {email}
Teléfono: {phone}

Ingresa al panel de administrador para revisar y aprobar esta solicitud.
"""
    try:
        ses_client.send_email(
            Source=ADMIN_EMAIL, # Remitente (Debe estar verificado en SES)
            Destination={
                'ToAddresses': [ADMIN_EMAIL] # Destinatario (El admin)
            },
            Message={
                'Subject': {'Data': subject},
                'Body': {'Text': {'Data': body_text}}
            }
        )
        print("Notificación SES enviada con éxito.")
    except ClientError as e:
        # Solo logueamos el error para no frenar el registro del cliente si el mail falla
        print("ERROR EN SES:", e.response['Error']['Message'])


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
                id,
                full_name,
                email,
                phone,
                business_name,
                delivery_method,
                carrier_name,
                carrier_phone,
                delivery_address,
                mail_adicional,
                telefono_oficina,
                telefono_adicional,
                cuit,
                condicion_fiscal,
                direccion,
                ciudad,
                provincia,
                direccion_transporte
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

        send_admin_notification(full_name, business_name, email, phone)

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
        # Aquí eliminas la solicitud de la tabla
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
            request_id = parts[3] # El ID está en la posición 3
            return reject_request(request_id)
    
        return bad_request("Ruta inválida")

    except Exception as e:
        print("HANDLER ERROR")
        print(str(e))
        return server_error()