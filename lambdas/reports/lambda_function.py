import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, bad_request, server_error


def handler(event, context):

    try:

        method = event["requestContext"]["http"]["method"]

        if method != "GET":
            return bad_request("Método no permitido")

        # =========================================================
        # AUTH
        # =========================================================

        user, error = require_auth(event)
        
        if error:
            return error
        
        user_id = user["id"]

        # =========================================================
        # PARAMS + PATH
        # =========================================================

        params = event.get("queryStringParameters") or {}

        raw_path = event.get("rawPath", "")

        # =========================================================
        # ROUTING
        # =========================================================

        if raw_path.endswith("/reports/account-summary"):
            return account_summary(user_id)
        
        elif raw_path.endswith("/reports/company-summary"):
            return company_summary(params)
        
        elif raw_path.endswith("/reports/commissions"):
            return commissions_report(params)
        
        elif raw_path.endswith("/reports/dashboard"):
            return dashboard_report()        

        else:
            return bad_request("Reporte inválido")

    except Exception as e:

        print(f"Error en lambda_reports: {str(e)}")
        return server_error()


# =========================================================
# RESUMEN CUENTA CORRIENTE CLIENTE
# =========================================================

def account_summary(user_id):

    if not user_id:
        return server_error()
    conn = get_connection()
    cur = conn.cursor()

    # Cliente
    cur.execute("""
        SELECT
            id,
            full_name,
            email
        FROM users
        WHERE id = %s
    """, [user_id])

    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        return bad_request("Usuario no encontrado")

    # Movimientos
    cur.execute("""
        SELECT
            type,
            description,
            amount,
            created_at
        FROM account_movements
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, [user_id])

    movement_rows = cur.fetchall()

    # Saldo total
    cur.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM account_movements
        WHERE user_id = %s
    """, [user_id])

    balance = float(cur.fetchone()[0])

    cur.close()
    conn.close()

    movements = [
        {
            "type": row[0],
            "description": row[1],
            "amount": float(row[2]),
            "created_at": str(row[3])
        }
        for row in movement_rows
    ]

    return success({
        "user_id": str(user[0]),
        "full_name": user[1],
        "email": user[2],
        "current_balance": balance,
        "movements": movements
    })


# =========================================================
# RESUMEN EMPRESA
# =========================================================

def company_summary(params):

    company_id = params.get("company_id")

    if not company_id:
        return bad_request("company_id es requerido")

    conn = get_connection()
    cur = conn.cursor()

    # Empresa
    cur.execute("""
        SELECT
            id,
            name,
            commission_percentage
        FROM companies
        WHERE id = %s
    """, [company_id])

    company = cur.fetchone()

    if not company:
        cur.close()
        conn.close()
        return bad_request("Empresa no encontrada")

    # Total pedidos
    cur.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE company_id = %s
    """, [company_id])

    total_orders = float(cur.fetchone()[0])

    # Total pagos
    cur.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE company_id = %s
    """, [company_id])

    total_payments = float(cur.fetchone()[0])

    # Total facturado
    cur.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM invoices
        WHERE company_id = %s
    """, [company_id])

    total_invoiced = float(cur.fetchone()[0])

    cur.close()
    conn.close()

    return success({
        "company_id": str(company[0]),
        "company_name": company[1],
        "commission_percentage": float(company[2] or 0),
        "total_orders": total_orders,
        "total_payments": total_payments,
        "total_invoiced": total_invoiced
    })


# =========================================================
# REPORTE COMISIONES
# =========================================================

def commissions_report(params):

    company_id = params.get("company_id")

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT
            c.id,
            c.order_id,
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
    conn.close()

    commissions = [
        {
            "id": str(row[0]),
            "order_id": str(row[1]),
            "company_name": row[2],
            "percentage": float(row[3]),
            "base_amount": float(row[4]),
            "commission_amount": float(row[5]),
            "is_reversed": row[6],
            "created_at": str(row[7])
        }
        for row in rows
    ]

    return success(commissions)


# =========================================================
# DASHBOARD GENERAL
# =========================================================

def dashboard_report():

    conn = get_connection()
    cur = conn.cursor()

    # Pedidos
    cur.execute("""
        SELECT COUNT(*)
        FROM orders
    """)

    total_orders = int(cur.fetchone()[0])

    # Usuarios
    cur.execute("""
        SELECT COUNT(*)
        FROM users
        WHERE role = 'customer'
    """)

    total_clients = int(cur.fetchone()[0])

    # Empresas
    cur.execute("""
        SELECT COUNT(*)
        FROM companies
        WHERE is_active = true
    """)

    total_companies = int(cur.fetchone()[0])

    # Facturación
    cur.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM invoices
    """)

    total_invoiced = float(cur.fetchone()[0])

    # Comisión total
    cur.execute("""
        SELECT COALESCE(SUM(commission_amount), 0)
        FROM commissions
        WHERE is_reversed = false
    """)

    total_commissions = float(cur.fetchone()[0])

    cur.close()
    conn.close()

    return success({
        "total_orders": total_orders,
        "total_clients": total_clients,
        "total_companies": total_companies,
        "total_invoiced": total_invoiced,
        "total_commissions": total_commissions
    })