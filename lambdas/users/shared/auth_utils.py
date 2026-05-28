# shared/auth_utils.py
from shared.utils import unauthorized

def get_current_user(event):
    """
    Extrae los datos del usuario autenticado desde el contexto JWT.
    API Gateway ya validó el token, solo leemos lo que nos dejó.
    """
    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        return {
            "id":    claims["sub"],        # ID único del usuario en Cognito
            "email": claims["email"],
            "role":  claims.get("custom:role", "customer")
        }
    except (KeyError, TypeError):
        return None


def require_auth(event):
    """
    Devuelve el usuario o lanza un error si no está autenticado.
    Usar en lambdas protegidas.
    """
    user = get_current_user(event)
    if not user:
        return None, unauthorized()
    return user, None


def require_admin(event):
    """
    Igual que require_auth pero además verifica que sea admin.
    Usar en todas las rutas /admin.
    """
    user, error = require_auth(event)
    if error:
        return None, error
    if user["role"] != "admin":
        return None, unauthorized()
    return user, None