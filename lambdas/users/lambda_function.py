# lambdas/users/lambda_function.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, bad_request, not_found, server_error

def handler(event, context):
    method = event["requestContext"]["http"]["method"]
    
    user, error = require_auth(event)
    if error:
        return error

    try:
        if method == "GET":
            return get_profile(user)
        elif method == "PATCH":
            body = json.loads(event.get("body") or "{}")
            return update_profile(user, body)
        else:
            return bad_request("Método no permitido")
    except Exception as e:
        print(f"Error en lambda_users: {str(e)}")
        return server_error()


def get_profile(user):
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT id, email, full_name, role, is_active, created_at, phone
        FROM users
        WHERE id = %s
    """, [user["id"]])

    row = cur.fetchone()

    if not row:
        cur.close()
        return not_found("Usuario no encontrado")

    # Traer empresas asociadas
    cur.execute("""
        SELECT c.id, c.name
        FROM user_companies uc
        INNER JOIN companies c ON uc.company_id = c.id
        WHERE uc.user_id = %s AND uc.is_enabled = true
    """, [user["id"]])

    companies = [
        {"id": str(r[0]), "name": r[1]}
        for r in cur.fetchall()
    ]

    cur.close()

    return success({
        "id":         str(row[0]),
        "email":      row[1],
        "full_name":  row[2],
        "role":       row[3],
        "is_active":  row[4],
        "created_at": str(row[5]),
        "phone":      row[6],
        "companies":  companies
    })

def update_profile(user, body):
    full_name = body.get("full_name", "").strip()
    
    if not full_name:
        return bad_request("full_name es requerido")

    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        UPDATE users
        SET full_name = %s
        WHERE id = %s
        RETURNING id, email, full_name, role
    """, [full_name, user["id"]])

    row = cur.fetchone()
    conn.commit()
    cur.close()

    if not row:
        return not_found("Usuario no encontrado")

    return success({
        "id":        str(row[0]),
        "email":     row[1],
        "full_name": row[2],
        "role":      row[3]
    })