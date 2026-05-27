# lambdas/cart/lambda_function.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, bad_request, not_found, server_error
from shared.schemas import validate_add_cart_item, validate_update_cart_item

def handler(event, context):
    method = event["requestContext"]["http"]["method"]
    path   = event["requestContext"]["http"]["path"]

    user, error = require_auth(event)
    if error:
        return error

    try:
        path_params = event.get("pathParameters") or {}
        item_id     = path_params.get("id")

        # GET /cart
        if method == "GET":
            params     = event.get("queryStringParameters") or {}
            company_id = params.get("company_id")
            if not company_id:
                return bad_request("company_id es requerido")
            return get_cart(user, company_id)

        # POST /cart/items
        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            return add_cart_item(user, body)

        # PATCH /cart/items/{id}
        elif method == "PATCH" and item_id:
            body = json.loads(event.get("body") or "{}")
            return update_cart_item(user, item_id, body)

        # DELETE /cart/items/{id}
        elif method == "DELETE" and item_id:
            return delete_cart_item(user, item_id)

        # DELETE /cart
        elif method == "DELETE":
            params     = event.get("queryStringParameters") or {}
            company_id = params.get("company_id")
            if not company_id:
                return bad_request("company_id es requerido")
            return delete_cart(user, company_id)

        else:
            return bad_request("Método no permitido")

    except Exception as e:
        print(f"Error en lambda_cart: {str(e)}")
        return server_error()


def get_or_create_cart(cur, user_id, company_id):
    """
    Busca el carrito abierto del usuario para esa empresa.
    Si no existe, lo crea. Siempre devuelve un cart_id válido.
    """
    cur.execute("""
        SELECT id FROM carts
        WHERE user_id   = %s
          AND company_id = %s
          AND status     = 'OPEN'
        LIMIT 1
    """, [user_id, company_id])

    row = cur.fetchone()
    if row:
        return str(row[0])

    # No existe, lo creamos
    cur.execute("""
        INSERT INTO carts (user_id, company_id, status)
        VALUES (%s, %s, 'OPEN')
        RETURNING id
    """, [user_id, company_id])

    return str(cur.fetchone()[0])


def get_cart(user, company_id):
    conn = get_connection()
    cur  = conn.cursor()

    cart_id = get_or_create_cart(cur, user["id"], company_id)
    conn.commit()

    cur.execute("""
        SELECT 
            ci.id,
            ci.product_id,
            p.name,
            p.code,
            p.price,
            p.unit_type,
            p.has_stock,
            p.stock_quantity,
            ci.quantity,
            ci.observations
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = %s
        ORDER BY ci.created_at ASC
    """, [cart_id])

    rows = cur.fetchall()
    cur.close()

    items = [
        {
            "id":             str(row[0]),
            "product_id":     str(row[1]),
            "product_name":   row[2],
            "product_code":   row[3],
            "price":          float(row[4]),
            "unit_type":      row[5],
            "has_stock":      row[6],
            "stock_quantity": row[7],
            "quantity":       float(row[8]),
            "observations":   row[9],
            "subtotal":       float(row[4]) * float(row[8])
        }
        for row in rows
    ]

    total = sum(item["subtotal"] for item in items)

    return success({
        "cart_id":    cart_id,
        "company_id": company_id,
        "items":      items,
        "total":      round(total, 2)
    })


def add_cart_item(user, body):
    error = validate_add_cart_item(body)
    if error:
        return bad_request(error)

    product_id = body["product_id"]
    company_id = body["company_id"]
    quantity   = body["quantity"]
    observations = body.get("observations", "")

    if quantity <= 0:
        return bad_request("La cantidad debe ser mayor a 0")

    conn = get_connection()
    cur  = conn.cursor()

    cart_id = get_or_create_cart(cur, user["id"], company_id)

    # Verificamos que el producto pertenezca a la empresa
    cur.execute("""
        SELECT id, price FROM products
        WHERE id = %s AND company_id = %s AND is_active = true
    """, [product_id, company_id])

    product = cur.fetchone()
    if not product:
        cur.close()
        return not_found("Producto no encontrado")

    # Si el producto ya está en el carrito, sumamos cantidad
    cur.execute("""
        SELECT id, quantity FROM cart_items
        WHERE cart_id = %s AND product_id = %s
    """, [cart_id, product_id])

    existing = cur.fetchone()

    if existing:
        new_quantity = float(existing[1]) + float(quantity)
        cur.execute("""
            UPDATE cart_items
            SET quantity = %s
            WHERE id = %s
            RETURNING id
        """, [new_quantity, existing[0]])
    else:
        cur.execute("""
            INSERT INTO cart_items (cart_id, product_id, quantity, observations)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, [cart_id, product_id, quantity, observations])

    conn.commit()
    cur.close()

    return success({"message": "Producto agregado al carrito"})


def update_cart_item(user, item_id, body):
    error = validate_update_cart_item(body)
    if error:
        return bad_request(error)

    quantity     = body.get("quantity")
    observations = body.get("observations")

    if quantity is not None and quantity <= 0:
        return bad_request("La cantidad debe ser mayor a 0")

    conn = get_connection()
    cur  = conn.cursor()

    # Verificamos que el item pertenezca a un carrito del usuario
    cur.execute("""
        SELECT ci.id FROM cart_items ci
        INNER JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = %s
          AND c.user_id = %s
          AND c.status  = 'OPEN'
    """, [item_id, user["id"]])

    if not cur.fetchone():
        cur.close()
        return not_found("Item no encontrado")

    # Actualizamos solo los campos que llegaron
    updates = []
    args    = []

    if quantity is not None:
        updates.append("quantity = %s")
        args.append(quantity)

    if observations is not None:
        updates.append("observations = %s")
        args.append(observations)

    args.append(item_id)

    cur.execute(f"""
        UPDATE cart_items
        SET {', '.join(updates)}
        WHERE id = %s
    """, args)

    conn.commit()
    cur.close()

    return success({"message": "Item actualizado"})


def delete_cart_item(user, item_id):
    conn = get_connection()
    cur  = conn.cursor()

    # Verificamos que el item pertenezca a un carrito del usuario
    cur.execute("""
        SELECT ci.id FROM cart_items ci
        INNER JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = %s
          AND c.user_id = %s
          AND c.status  = 'OPEN'
    """, [item_id, user["id"]])

    if not cur.fetchone():
        cur.close()
        return not_found("Item no encontrado")

    cur.execute("DELETE FROM cart_items WHERE id = %s", [item_id])
    conn.commit()
    cur.close()

    return success({"message": "Item eliminado"})


def delete_cart(user, company_id):
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        UPDATE carts
        SET status = 'CANCELLED'
        WHERE user_id    = %s
          AND company_id = %s
          AND status     = 'OPEN'
        RETURNING id
    """, [user["id"], company_id])

    row = cur.fetchone()
    conn.commit()
    cur.close()

    if not row:
        return not_found("No hay carrito activo para esta empresa")

    return success({"message": "Carrito eliminado"})