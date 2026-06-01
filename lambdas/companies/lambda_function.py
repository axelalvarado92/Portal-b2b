# lambdas/companies/lambda_function.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, not_found, bad_request, server_error

def handler(event, context):
    method    = event["requestContext"]["http"]["method"]
    path      = event["requestContext"]["http"]["path"]

    user, error = require_auth(event)
    if error:
        return error

    try:
        # GET /companies/{id}
        if (
            method == "GET"
            and event.get("pathParameters")
            and event["pathParameters"].get("id")
        ):
            company_id = event["pathParameters"]["id"]
            return get_company(user, company_id)

        # GET /companies
        elif method == "GET":
            return list_companies(user)

        else:
            return bad_request("Método no permitido")

    except Exception as e:
        print(f"Error en lambda_companies: {str(e)}")
        return server_error()


def list_companies(user):
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT 
            c.id,
            c.name,
            c.logo_url,
            c.description,
            c.contact_email,
            uc.discount_percentage
        FROM companies c
        INNER JOIN user_companies uc 
            ON c.id = uc.company_id
        WHERE uc.user_id = %s
          AND uc.is_enabled = true
          AND c.is_active = true
        ORDER BY c.name ASC
    """, [user["id"]])

    rows = cur.fetchall()
    cur.close()

    companies = [
        {
            "id":                  str(row[0]),
            "name":                row[1],
            "logo_url":            row[2],
            "description":         row[3],
            "contact_email":       row[4],
            "discount_percentage": float(row[5]) if row[5] else 0
        }
        for row in rows
    ]

    return success(companies)


def get_company(user, company_id):
    conn = get_connection()
    cur  = conn.cursor()

    # Verificamos acceso del usuario a esta empresa específica
    cur.execute("""
        SELECT 
            c.id,
            c.name,
            c.logo_url,
            c.description,
            c.contact_email,
            uc.discount_percentage
        FROM companies c
        INNER JOIN user_companies uc 
            ON c.id = uc.company_id
        WHERE uc.user_id = %s
          AND c.id = %s
          AND uc.is_enabled = true
          AND c.is_active = true
    """, [user["id"], company_id])

    row = cur.fetchone()
    cur.close()

    if not row:
        return not_found("Empresa no encontrada")

    return success({
        "id":                  str(row[0]),
        "name":                row[1],
        "logo_url":            row[2],
        "description":         row[3],
        "contact_email":       row[4],
        "discount_percentage": float(row[5]) if row[5] else 0
    })