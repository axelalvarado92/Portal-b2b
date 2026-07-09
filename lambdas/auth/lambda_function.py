import json
import os
import boto3

from shared.utils import (
    success,
    bad_request,
    server_error
)

cognito = boto3.client(
    "cognito-idp",
    region_name=os.environ["AWS_REGION"]
)

CLIENT_ID = os.environ["COGNITO_CLIENT_ID"]


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

        response = cognito.respond_to_auth_challenge(
            ClientId=CLIENT_ID,
            ChallengeName="NEW_PASSWORD_REQUIRED",
            Session=session,
            ChallengeResponses={
                "USERNAME": email,
                "NEW_PASSWORD": new_password
            }
        )

        auth = response["AuthenticationResult"]

        return success({
            "access_token": auth["AccessToken"],
            "id_token": auth["IdToken"],
            "refresh_token": auth["RefreshToken"],
            "expires_in": auth["ExpiresIn"]
        })

    except cognito.exceptions.InvalidPasswordException:
        return bad_request("La contraseña no cumple los requisitos de seguridad")

    except cognito.exceptions.NotAuthorizedException:
        return bad_request("Sesión inválida o expirada, iniciá sesión de nuevo")

    except Exception as e:
        print("COMPLETE NEW PASSWORD ERROR")
        print(str(e))
        return server_error()


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

    try:
        cognito.forgot_password(
            ClientId=CLIENT_ID,
            Username=email
        )
        return success({"message": "Código enviado al email"})

    except cognito.exceptions.UserNotFoundException:
        return bad_request("Usuario no encontrado")

    except Exception as e:
        print(str(e))
        return server_error()


def confirm_forgot_password(body):
    email = body.get("email")
    code = body.get("code")
    new_password = body.get("new_password")

    if not email or not code or not new_password:
        return bad_request("email, code y new_password son requeridos")

    try:
        cognito.confirm_forgot_password(
            ClientId=CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
            Password=new_password
        )
        return success({"message": "Contraseña actualizada"})

    except cognito.exceptions.CodeMismatchException:
        return bad_request("Código inválido")

    except cognito.exceptions.ExpiredCodeException:
        return bad_request("Código expirado")

    except Exception as e:
        print(str(e))
        return server_error()


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
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "*"
                },
                "body": ""
            }

        body = json.loads(
            event.get("body") or "{}"
        )

        if path == "/auth/login":
            return login(body)
        
        if path == "/auth/complete-new-password":
            return complete_new_password(body)

        if path == "/auth/refresh":
            return refresh_token(body)
        
        if path == "/auth/forgot-password":
            return forgot_password(body)
        
        if path == "/auth/confirm-forgot-password":
            return confirm_forgot_password(body)
        
        if path == "/auth/register":
            return register(body)

        return bad_request("Ruta inválida")

    except Exception as e:

        print(str(e))

        return server_error()