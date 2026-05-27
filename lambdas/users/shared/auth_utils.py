from shared.utils import unauthorized
from shared.db import get_connection


def get_current_user(event):
    """
    Extrae usuario autenticado desde JWT
    y lo busca en PostgreSQL usando cognito_sub.
    """

    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]

        cognito_sub = claims["sub"]

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, email, role, is_active
            FROM users
            WHERE cognito_sub = %s
        """, [cognito_sub])

        row = cur.fetchone()

        cur.close()
        conn.close()

        if not row:
            return None

        return {
            "id": str(row[0]),
            "email": row[1],
            "role": row[2],
            "is_active": row[3]
        }

    except Exception as e:
        print(f"Auth error: {str(e)}")
        return None


def require_auth(event):
    """
    Devuelve usuario autenticado.
    """

    user = get_current_user(event)

    if not user:
        return None, unauthorized()

    return user, None


def require_admin(event):
    """
    Verifica usuario admin.
    """

    user, error = require_auth(event)

    if error:
        return None, error

    if user["role"] != "admin":
        return None, unauthorized()

    return user, None