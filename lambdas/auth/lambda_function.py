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
    print("LOGIN REQUEST")
    print(email)

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

        if path == "/auth/refresh":
            return refresh_token(body)

        return bad_request("Ruta inválida")

    except Exception as e:

        print(str(e))

        return server_error()