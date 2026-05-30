# shared/auth_utils.py
import json
from shared.db import get_connection
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
    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        sub = claims["sub"]
    except Exception:
        return None, unauthorized()

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, email, role, company_id
        FROM users
        WHERE cognito_sub = %s
        LIMIT 1
    """, [sub])

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return None, unauthorized()

    return {
        "id": row[0],
        "email": row[1],
        "role": row[2],
        "company_id": row[3],
        "cognito_sub": sub
    }, None


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