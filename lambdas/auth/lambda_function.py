import json
import os
import boto3
import secrets
import string
from datetime import datetime, timedelta
from shared.db import get_connection

from shared.utils import (
    success,
    bad_request,
    server_error
)

cognito = boto3.client(
    "cognito-idp",
    region_name=os.environ["AWS_REGION"]
)
ses = boto3.client("ses", region_name=os.environ.get("AWS_REGION", "sa-east-1"))
ADMIN_EMAIL = "noreply@snbrepresentaciones.com.ar"

CLIENT_ID = os.environ["COGNITO_CLIENT_ID"]

USER_POOL_ID = os.environ.get("USER_POOL_ID")


def login(body):

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return bad_request("email y password son requeridos")

    try:

        response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password
            }
        )

        # Cognito pide establecer una contraseña nueva (primer login con clave temporal)
        if response.get("ChallengeName") == "NEW_PASSWORD_REQUIRED":
            return success({
                "challenge": "NEW_PASSWORD_REQUIRED",
                "session": response["Session"],
                "email": email
            })

        auth = response["AuthenticationResult"]

        return success({
            "access_token": auth["AccessToken"],
            "id_token": auth["IdToken"],
            "refresh_token": auth["RefreshToken"],
            "expires_in": auth["ExpiresIn"]
        })

    except cognito.exceptions.NotAuthorizedException:

        return bad_request("Credenciales inválidas")

    except Exception as e:
        print("LOGIN ERROR")
        print(str(e))
        return server_error()


def complete_new_password(body):

    email = body.get("email")
    new_password = body.get("new_password")
    session = body.get("session")

    if not email or not new_password or not session:
        return bad_request("email, new_password y session son requeridos")

    try:
        # 1. Obtener TODOS los atributos del usuario desde Cognito
        user_info = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=email
        )
        
        # 2. Convertir atributos a diccionario
        user_attrs = {
            attr["Name"]: attr["Value"] 
            for attr in user_info.get("UserAttributes", [])
        }
        
        print("ATRIBUTOS DEL USUARIO:", json.dumps(user_attrs, indent=2))
        
        # 3. Construir ChallengeResponses con TODOS los atributos
        challenge_responses = {
            "USERNAME": email,
            "NEW_PASSWORD": new_password,
        }
        
        # Agregar todos los atributos que tiene el usuario en Cognito
        for attr_name, attr_value in user_attrs.items():
            challenge_responses[attr_name] = attr_value
        
        print("ENVIANDO CHALLENGE CON:", {k: v for k, v in challenge_responses.items() if k != "NEW_PASSWORD"})

        # 4. Responder el challenge
        response = cognito.respond_to_auth_challenge(
            ClientId=CLIENT_ID,
            ChallengeName="NEW_PASSWORD_REQUIRED",
            Session=session,
            ChallengeResponses=challenge_responses
        )

        print("CHALLENGE EXITOSO")
        
        auth = response["AuthenticationResult"]

        return success({
            "access_token": auth["AccessToken"],
            "id_token": auth["IdToken"],
            "refresh_token": auth["RefreshToken"],
            "expires_in": auth["ExpiresIn"]
        })

    except cognito.exceptions.InvalidPasswordException:
        return bad_request("La contraseña no cumple los requisitos (mín. 8 caracteres, al menos 1 número)")

    except cognito.exceptions.NotAuthorizedException as e:
        print("SESSION INVALIDO:", str(e))
        return bad_request("Sesión expirada. Volvé a iniciar sesión con tu contraseña temporal.")

    except Exception as e:
        print("ERROR COMPLETE NEW PASSWORD:", str(e))
        return server_error(str(e))


def refresh_token(body):

    refresh_token = body.get("refresh_token")

    if not refresh_token:
        return bad_request("refresh_token requerido")

    try:

        response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={
                "REFRESH_TOKEN": refresh_token
            }
        )

        auth = response["AuthenticationResult"]

        return success({
            "access_token": auth["AccessToken"],
            "id_token": auth["IdToken"],
            "expires_in": auth["ExpiresIn"]
        })

    except Exception as e:

        print(str(e))

        return server_error()
    
def forgot_password(body):
    email = body.get("email")
    if not email:
        return bad_request("email es requerido")

    # 1. Verificar que el usuario existe en Cognito
    try:
        cognito.admin_get_user(
            UserPoolId=os.environ["USER_POOL_ID"],
            Username=email
        )
    except cognito.exceptions.UserNotFoundException:
        return bad_request("Usuario no encontrado")
    except Exception as e:
        return server_error(f"Error verificando usuario: {str(e)}")

    # 2. Generar código de 6 dígitos
    reset_code = ''.join(secrets.choice(string.digits) for _ in range(6))

    # 3. Guardar en DB con vencimiento de 15 minutos
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Invalidar códigos anteriores no usados
        cur.execute("""
            UPDATE password_resets 
            SET used = TRUE 
            WHERE email = %s AND used = FALSE
        """, [email])

        # Insertar nuevo código
        cur.execute("""
            INSERT INTO password_resets (email, code, expires_at)
            VALUES (%s, %s, NOW() + INTERVAL '15 minutes')
        """, [email, reset_code])

        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(f"Error guardando código: {str(e)}")
    finally:
        cur.close()
        conn.close()

    # 4. Enviar email vía SES
    try:
        login_url = "https://snbrepresentaciones.com.ar/login"

        ses.send_email(
            Source=ADMIN_EMAIL,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": "Recuperación de contraseña - SNB Representaciones"},
                "Body": {
                    "Html": {
                        "Data": f"""<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:20px 0;">
        <img src="https://snbrepresentaciones.com.ar/logo-share.png" alt="SNB" style="max-width:200px;">
    </div>
    <h2 style="color:#6b1426;">Recuperación de contraseña</h2>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;text-align:center;">
        <p style="margin:5px 0;font-size:14px;color:#666;">Tu código de verificación es:</p>
        <p style="margin:10px 0;font-size:32px;font-weight:bold;color:#6b1426;letter-spacing:4px;">{reset_code}</p>
    </div>
    <p style="text-align:center;">Este código expira en <strong>15 minutos</strong>.</p>
    <p style="text-align:center;">Si no solicitaste este cambio, ignorá este email.</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:30px 0;">
    <p style="font-size:12px;color:#666;text-align:center;">
        SNB Representaciones - Sistema B2B<br>
        Este es un email automático, no respondas a esta dirección.
    </p>
</body>
</html>"""
                    }
                }
            }
        )
    except Exception as e:
        print(f"Error enviando email de recuperación: {e}")

    return success({
        "message": "Si el email existe, recibirás un código de recuperación"
    })


def confirm_forgot_password(body):
    email = body.get("email")
    code = body.get("code")
    new_password = body.get("new_password")

    if not email or not code or not new_password:
        return bad_request("email, code y new_password son requeridos")

    # 1. Buscar código válido en DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT code, expires_at, used 
            FROM password_resets 
            WHERE email = %s 
            ORDER BY created_at DESC 
            LIMIT 1
        """, [email])

        row = cur.fetchone()

        if not row:
            return bad_request("Código inválido o expirado")

        db_code, expires_at, used = row

        if used:
            return bad_request("Este código ya fue utilizado")

        if expires_at < datetime.now():
            return bad_request("El código expiró. Solicitá uno nuevo")

        if db_code != code:
            return bad_request("Código incorrecto")

        # 2. Cambiar contraseña en Cognito
        try:
            cognito.admin_set_user_password(
                UserPoolId=os.environ["USER_POOL_ID"],
                Username=email,
                Password=new_password,
                Permanent=True
            )
        except cognito.exceptions.InvalidPasswordException:
            # 💡 IMPORTANTE: No marcamos el código como usado si la contraseña es inválida
            return bad_request("La contraseña no cumple los requisitos de seguridad")
        except Exception as e:
            return server_error(f"Error actualizando contraseña: {str(e)}")

        # 3. Solo si Cognito aceptó la contraseña, marcamos el código como usado
        cur.execute("""
            UPDATE password_resets 
            SET used = TRUE 
            WHERE email = %s AND code = %s
        """, [email, code])

        conn.commit()

    except Exception as e:
        conn.rollback()
        return server_error(f"Error en proceso de recuperación: {str(e)}")
    finally:
        cur.close()
        conn.close()

    return success({
        "message": "Contraseña actualizada correctamente"
    })


def register(body):
    email = body.get("email")
    password = body.get("password")
    full_name = body.get("full_name", "")

    if not email or not password:
        return bad_request("email y password son requeridos")

    try:
        cognito.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "name", "Value": full_name}
            ]
        )
        return success({"message": "Usuario registrado, revisá tu email para confirmar"})

    except cognito.exceptions.UsernameExistsException:
        return bad_request("El email ya está registrado")

    except cognito.exceptions.InvalidPasswordException:
        return bad_request("La contraseña no cumple los requisitos")

    except Exception as e:
        print(str(e))
        return server_error()


def handler(event, context):

    try:

        path = event["requestContext"]["http"]["path"]
        method = event["requestContext"]["http"]["method"]

        if method == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                "body": ""
            }

        body = json.loads(
            event.get("body") or "{}"
        )

        response = None

        if path == "/auth/login":
            response = login(body)
        
        elif path == "/auth/complete-new-password":
            response = complete_new_password(body)

        elif path == "/auth/refresh":
            response = refresh_token(body)
        
        elif path == "/auth/forgot-password":
            response = forgot_password(body)
        
        elif path == "/auth/confirm-forgot-password":
            response = confirm_forgot_password(body)
        
        elif path == "/auth/register":
            response = register(body)

        else:
            response = bad_request("Ruta inválida")

        # ── GARANTIZAR CORS EN TODAS LAS RESPUESTAS ──
        if not isinstance(response, dict):
            response = {}

        if "headers" not in response or response["headers"] is None:
            response["headers"] = {}

        response["headers"]["Access-Control-Allow-Origin"] = "*"
        response["headers"]["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response["headers"]["Access-Control-Allow-Methods"] = "OPTIONS,POST,GET"

        return response

    except Exception as e:

        print(str(e))

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({"error": "Error interno del servidor"})
        }