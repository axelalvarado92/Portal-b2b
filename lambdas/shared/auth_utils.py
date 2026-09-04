from shared.db import get_connection
from shared.utils import unauthorized

def get_current_user(event):
    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        return {
            "id": claims["sub"],
            "email": claims["email"],
            "role": claims.get("custom:role", "customer")
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

    # 💡 Buscamos por cognito_sub primero, y si no, por id (que también es el sub)
    cur.execute("""
        SELECT id, email, role, company_id
        FROM users
        WHERE cognito_sub = %s OR id = %s
        LIMIT 1
    """, [sub, sub])

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
    user, error = require_auth(event)
    if error:
        return None, error
    if user["role"] != "admin":
        return None, unauthorized()
    return user, None