# lambdas/products/lambda_function.py

import sys
import os
import traceback
import json

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
        print("🔥 PRODUCTS ERROR FULL:")
        raise 


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

def normalize_attributes(attributes):
    if isinstance(attributes, str):
        try:
            attributes = json.loads(attributes)
        except Exception:
            attributes = {}

    if attributes is None:
        attributes = {}

    return attributes


def build_variant(row):
    return {
        "id": str(row[0]),
        "sku": row[1],
        "price": float(row[2]) if row[2] is not None else 0.0,
        "stock": row[3],
        "attributes": normalize_attributes(row[4])
    }


def list_products(user, params):

    company_id  = params.get("company_id")
    category_id = params.get("category_id")
    search      = params.get("search", "").strip()
    
    page = int(params.get("page", 1))
    limit = int(params.get("limit", 20))
    
    offset = (page - 1) * limit

    if not company_id:
        return bad_request("company_id es requerido")

    conn = get_connection()
    cur  = conn.cursor()

    try:

        if not check_company_access(cur, user["id"], company_id):
            return not_found("Empresa no encontrada")

        # Query base
        count_query = """
            SELECT COUNT(*)
            FROM products p
            WHERE p.company_id = %s
              AND p.is_active = true
        """
        
        count_args = [company_id]

        query = """
            SELECT
                p.id,
                p.code,
                p.name,
                p.description,
                p.image_url,
                p.has_variants,
        
                c.id AS category_id,
                c.name AS category_name
        
            FROM products p
        
            LEFT JOIN categories c
                ON p.category_id = c.id
        
            WHERE p.company_id = %s
              AND p.is_active = true
        """
        
        args = [company_id]

        # Filtro por categoría (opcional)
        if category_id:

            query += " AND p.category_id = %s"
            args.append(category_id)
        
            count_query += " AND p.category_id = %s"
            count_args.append(category_id)

        # Búsqueda por nombre o código (opcional)
        if search:

            query += """
                AND (
                    p.name ILIKE %s
                    OR p.code ILIKE %s
                )
            """
        
            args.extend([
                f"%{search}%",
                f"%{search}%"
            ])
        
            count_query += """
                AND (
                    p.name ILIKE %s
                    OR p.code ILIKE %s
                )
            """
        
            count_args.extend([
                f"%{search}%",
                f"%{search}%"
            ])

        query += """
            ORDER BY p.name ASC
            LIMIT %s
            OFFSET %s
        """
        
        args.extend([limit, offset])

        cur.execute(count_query, count_args)

        total = cur.fetchone()[0]

        cur.execute(query, args)

        rows = cur.fetchall()

        product_ids = [row[0] for row in rows]

        variants_by_product = {}
        
        if product_ids:
            cur.execute("""
                SELECT
                    id,
                    product_id,
                    sku,
                    price,
                    stock,
                    attributes
                FROM product_variants
                WHERE product_id = ANY(%s::uuid[])
                  AND is_active = true
                ORDER BY created_at
            """, [product_ids])
        
            variant_rows = cur.fetchall()
        
            for variant_row in variant_rows:
                product_id = variant_row[1]
        
                variant = build_variant([
                    variant_row[0],
                    variant_row[2],
                    variant_row[3],
                    variant_row[4],
                    variant_row[5]
                ])
        
                variants_by_product.setdefault(product_id, []).append(variant)

        products = []

        for row in rows:

            variants = variants_by_product.get(row[0], [])
    
            products.append({
                "id": str(row[0]),
                "code": row[1],
                "name": row[2],
                "description": row[3],
                "image_url": row[4],
                "has_variants": row[5],
    
                "default_variant": variants[0] if variants else None,
    
                "variants": variants,
    
                "category": {
                    "id": str(row[6]) if row[6] else None,
                    "name": row[7] if row[7] else None
                }
            })
    
        return success({
            "items": products,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (
                (total + limit - 1) // limit
            )
        })
    
    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

       cur.close()
       conn.close()


def get_product(user, product_id):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # 1. Obtener el producto
        cur.execute("""
            SELECT
                p.id,
                p.code,
                p.name,
                p.description,
                p.image_url,
                p.has_variants,
                p.company_id,

                c.id AS category_id,
                c.name AS category_name

            FROM products p

            LEFT JOIN categories c
                ON p.category_id = c.id

            WHERE p.id = %s
              AND p.is_active = true
        """, [product_id])

        row = cur.fetchone()

        if not row:
            return not_found("Producto no encontrado")

        # 2. Verificar acceso del usuario a la empresa
        if not check_company_access(
            cur,
            user["id"],
            str(row[6])
        ):
            return not_found("Producto no encontrado")

        # 3. Obtener TODAS las variantes activas
        cur.execute("""
            SELECT
                id,
                sku,
                price,
                stock,
                attributes
            FROM product_variants
            WHERE product_id = %s
              AND is_active = true
            ORDER BY created_at ASC
        """, [product_id])

        variant_rows = cur.fetchall()

        variants = []

        for variant_row in variant_rows:

            variant = build_variant([
                variant_row[0],
                variant_row[1],
                variant_row[2],
                variant_row[3],
                variant_row[4]
            ])

            variants.append(variant)

        # 4. La primera variante activa es la default
        default_variant = variants[0] if variants else None

        # 5. Construir respuesta
        return success({
            "id": str(row[0]),
            "code": row[1],
            "name": row[2],
            "description": row[3],
            "image_url": row[4],
            "has_variants": row[5],
            "company_id": str(row[6]) if row[6] else None,  # ← AGREGAR ESTA LÍNEA
            "default_variant": default_variant,
            "variants": variants,
            "category": {
                "id": str(row[7]) if row[7] else None,
                "name": row[8] if row[8] else None
            }
        })

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

        cur.close()
        conn.close()