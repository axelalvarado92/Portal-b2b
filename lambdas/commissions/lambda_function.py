# lambdas/commissions/lambda_function.py

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, bad_request, not_found, server_error


def handler(event, context):
    method = event["requestContext"]["http"]["method"]

    user, error = require_auth(event)
    if error:
        return error

    try:
        path_params = event.get("pathParameters") or {}

        # GET /commissions
        if method == "GET" and not path_params.get("company_id"):
            params = event.get("queryStringParameters") or {}
            return list_commissions(user, params)

        # GET /commissions/company/{company_id}
        elif method == "GET" and path_params.get("company_id"):
            company_id = path_params["company_id"]
            return company_report(user, company_id)

        else:
            return bad_request("Método no permitido")

    except Exception as e:
        print(f"Error en lambda_commissions: {str(e)}")
        return server_error()


def list_commissions(user, params):
    """
    Lista general de comisiones.
    Puede filtrarse por empresa.
    """

    company_id = params.get("company_id")

    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            c.id,
            c.order_id,
            c.company_id,
            co.name,
            c.percentage,
            c.base_amount,
            c.commission_amount,
            c.is_reversed,
            c.created_at
        FROM commissions c
        INNER JOIN companies co
            ON c.company_id = co.id
        WHERE 1=1
    """

    args = []

    if company_id:
        query += " AND c.company_id = %s"
        args.append(company_id)

    query += " ORDER BY c.created_at DESC"

    cur.execute(query, args)
    rows = cur.fetchall()

    cur.close()

    commissions = [
        {
            "id": str(row[0]),
            "order_id": str(row[1]),
            "company_id": str(row[2]),
            "company_name": row[3],
            "percentage": float(row[4]),
            "base_amount": float(row[5]),
            "commission_amount": float(row[6]),
            "is_reversed": row[7],
            "created_at": str(row[8])
        }
        for row in rows
    ]

    return success(commissions)


def company_report(user, company_id):
    """
    Reporte resumido de comisiones por empresa.
    """

    conn = get_connection()
    cur  = conn.cursor()

    # Verificamos existencia empresa
    cur.execute("""
        SELECT id, name
        FROM companies
        WHERE id = %s
    """, [company_id])

    company = cur.fetchone()

    if not company:
        cur.close()
        return not_found("Empresa no encontrada")

    # Totales generales
    cur.execute("""
        SELECT
            COUNT(*),
            COALESCE(SUM(base_amount), 0),
            COALESCE(SUM(commission_amount), 0)
        FROM commissions
        WHERE company_id = %s
          AND is_reversed = false
    """, [company_id])

    totals = cur.fetchone()

    # Comisiones revertidas
    cur.execute("""
        SELECT
            COUNT(*),
            COALESCE(SUM(commission_amount), 0)
        FROM commissions
        WHERE company_id = %s
          AND is_reversed = true
    """, [company_id])

    reversed_data = cur.fetchone()

    # Últimas comisiones
    cur.execute("""
        SELECT
            id,
            order_id,
            percentage,
            base_amount,
            commission_amount,
            is_reversed,
            created_at
        FROM commissions
        WHERE company_id = %s
        ORDER BY created_at DESC
        LIMIT 20
    """, [company_id])

    rows = cur.fetchall()

    cur.close()

    return success({
        "company": {
            "id": str(company[0]),
            "name": company[1]
        },

        "summary": {
            "total_orders": totals[0],
            "total_sales": float(totals[1]),
            "total_commissions": float(totals[2]),

            "reversed_commissions_count": reversed_data[0],
            "reversed_commissions_amount": float(reversed_data[1])
        },

        "latest_commissions": [
            {
                "id": str(row[0]),
                "order_id": str(row[1]),
                "percentage": float(row[2]),
                "base_amount": float(row[3]),
                "commission_amount": float(row[4]),
                "is_reversed": row[5],
                "created_at": str(row[6])
            }
            for row in rows
        ]
    })