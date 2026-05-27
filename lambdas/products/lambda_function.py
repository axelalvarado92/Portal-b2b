# lambdas/products/lambda_function.py

import sys
import os
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, not_found, bad_request, server_error


def handler(event, context):
    method = event["requestContext"]["http"]["method"]

    user, error = require_auth(event)
    if error:
        return error

    try:
        if method == "GET" and event.get("pathParameters") and event["pathParameters"].get("id"):
            product_id = event["pathParameters"]["id"]
            return get_product(user, product_id)

        elif method == "GET":
            params = event.get("queryStringParameters") or {}
            return list_products(user, params)

        else:
            return bad_request("Método no permitido")

    except Exception:
        print(traceback.format_exc())
        return server_error()


def check_company_access(cur, user_id, company_id):
    """
    Verifica que el usuario tenga acceso a la empresa.
    Devuelve True si tiene acceso, False si no.
    """

    cur.execute("""
        SELECT 1 FROM user_companies
        WHERE user_id = %s
          AND company_id = %s
          AND is_enabled = true
    """, [user_id, company_id])

    return cur.fetchone() is not None


def list_products(user, params):

    company_id  = params.get("company_id")
    category_id = params.get("category_id")
    search      = params.get("search", "").strip()

    if not company_id:
        return bad_request("company_id es requerido")

    conn = get_connection()
    cur  = conn.cursor()

    try:

        if not check_company_access(cur, user["id"], company_id):
            return not_found("Empresa no encontrada")

        # Query base
        query = """
            SELECT 
                p.id,
                p.code,
                p.name,
                p.description,
                p.image_url,
                p.price,
                p.has_stock,
                p.stock_quantity,
                p.unit_type,
                c.id   AS category_id,
                c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.company_id = %s
              AND p.is_active = true
        """

        args = [company_id]

        # Filtro por categoría (opcional)
        if category_id:
            query += " AND p.category_id = %s"
            args.append(category_id)

        # Búsqueda por nombre o código (opcional)
        if search:
            query += " AND (p.name ILIKE %s OR p.code ILIKE %s)"
            args.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY p.name ASC"

        cur.execute(query, args)
        rows = cur.fetchall()

        products = [
            {
                "id":             str(row[0]),
                "code":           row[1],
                "name":           row[2],
                "description":    row[3],
                "image_url":      row[4],
                "price":          float(row[5]),
                "has_stock":      row[6],
                "stock_quantity": row[7],
                "unit_type":      row[8],
                "category": {
                    "id":   str(row[9]) if row[9] else None,
                    "name": row[10] if row[10] else None
                }
            }
            for row in rows
        ]

        return success(products)

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

        cur.close()


def get_product(user, product_id):

    conn = get_connection()
    cur  = conn.cursor()

    try:

        cur.execute("""
            SELECT 
                p.id,
                p.code,
                p.name,
                p.description,
                p.image_url,
                p.price,
                p.has_stock,
                p.stock_quantity,
                p.unit_type,
                p.company_id,
                c.id   AS category_id,
                c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s
              AND p.is_active = true
        """, [product_id])

        row = cur.fetchone()

        if not row:
            return not_found("Producto no encontrado")

        # Verificamos acceso a la empresa del producto
        if not check_company_access(cur, user["id"], str(row[9])):
            return not_found("Producto no encontrado")

        return success({
            "id":             str(row[0]),
            "code":           row[1],
            "name":           row[2],
            "description":    row[3],
            "image_url":      row[4],
            "price":          float(row[5]),
            "has_stock":      row[6],
            "stock_quantity": row[7],
            "unit_type":      row[8],
            "category": {
                "id":   str(row[10]) if row[10] else None,
                "name": row[11] if row[11] else None
            }
        })

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

        cur.close()