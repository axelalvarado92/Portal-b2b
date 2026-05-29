from shared.db import get_connection


def handler(event, context):

    try:

        method = event["requestContext"]["http"]["method"]
        path = event["requestContext"]["http"]["path"]

        body = json.loads(event.get("body") or "{}")

        if path == "/auth/login":
            return login(body)

        if path == "/auth/refresh":
            return refresh_token(body)

        return bad_request("Ruta inválida")

    except Exception as e:
        print(str(e))
        return server_error()