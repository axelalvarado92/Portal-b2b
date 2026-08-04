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

        # GET /cart/all
        if method == "GET" and path.endswith("/cart/all"):
            return get_all_carts(user)

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
        print("🔥 CART ERROR FULL:")
        print(str(e))
        raise e


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
            ci.unit_price,
            p.unit_type,
            p.has_stock,
            p.stock_quantity,
            ci.quantity,
            ci.observations,
            ci.variant_selection
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
            "observations": row[9],
            "variant_selection": row[10] if row[10] else {},
            "subtotal": float(row[4]) * float(row[8])
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

def get_all_carts(user):
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            c.id,
            c.company_id,
            co.name
        FROM carts c
        INNER JOIN companies co ON c.company_id = co.id
        WHERE c.user_id = %s
          AND c.status  = 'OPEN'
        ORDER BY co.name ASC
    """, [user["id"]])

    cart_rows = cur.fetchall()

    carts = []

    for cart_id, company_id, company_name in cart_rows:

        cur.execute("""
            SELECT 
                ci.id,
                ci.product_id,
                p.name,
                p.code,
                ci.unit_price,
                p.unit_type,
                p.has_stock,
                p.stock_quantity,
                ci.quantity,
                ci.observations,
                ci.variant_selection
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = %s
            ORDER BY ci.created_at ASC
        """, [cart_id])

        item_rows = cur.fetchall()

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
                "subtotal":       float(row[4]) * float(row[8]),
                "variant_selection": row[10] if row[10] else {},
            }
            for row in item_rows
        ]

        # Solo incluimos carritos que tengan al menos un item
        if items:
            total = sum(item["subtotal"] for item in items)

            carts.append({
                "cart_id":      str(cart_id),
                "company_id":   str(company_id),
                "company_name": company_name,
                "items":        items,
                "total":        round(total, 2)
            })

    cur.close()

    grand_total = sum(c["total"] for c in carts)

    return success({
        "carts": carts,
        "grand_total": round(grand_total, 2)
    })


def add_cart_item(user, body):
    error = validate_add_cart_item(body)
    if error:
        return bad_request(error)

    product_id = body["product_id"]
    company_id = body["company_id"]
    quantity   = body["quantity"]
    observations = body.get("observations", "")
    variant_selection = body.get("variant_selection", {})

    if quantity <= 0:
        return bad_request("La cantidad debe ser mayor a 0")

    conn = get_connection()
    cur  = conn.cursor()

    cart_id = get_or_create_cart(cur, user["id"], company_id)

    # Verificamos que el producto pertenezca a la empresa
    cur.execute("""
        SELECT id, price, attributes FROM products
        WHERE id = %s AND company_id = %s AND is_active = true
    """, [product_id, company_id])

    product = cur.fetchone()

    if not product:
        cur.close()
        return not_found("Producto no encontrado")
    
    base_price = float(product[1])
    
    attributes = product[2] or {}
    
    try:
        if isinstance(attributes, str):
            attributes = json.loads(attributes)
    except:
        attributes = {}
    
    unit_price = base_price
    
    for group in attributes.get("variant_groups", []):
    
        selected = variant_selection.get(group["name"])
    
        if not selected:
            continue
    
        for option in group["options"]:
    
            if option["value"] == selected:
                unit_price += float(option.get("price_extra", 0))
                break

    # Si el producto ya está en el carrito, sumamos cantidad
    cur.execute("""
        SELECT id, quantity
        FROM cart_items
        WHERE cart_id = %s
          AND product_id = %s
          AND variant_selection = %s::jsonb
    """, [
        cart_id,
        product_id,
        json.dumps(variant_selection)
    ])
    
    existing = cur.fetchone()

    if existing:

        new_quantity = float(existing[1]) + float(quantity)
    
        cur.execute("""
            UPDATE cart_items
            SET
                quantity = %s,
                observations = %s,
                variant_selection = %s,
                unit_price = %s
            WHERE id = %s
            RETURNING id
        """, [
            new_quantity,
            observations,
            json.dumps(variant_selection),
            unit_price,
            existing[0]
        ])
    else:
        cur.execute("""
            INSERT INTO cart_items (
                cart_id,
                product_id,
                quantity,
                observations,
                variant_selection,
                unit_price
            )
            VALUES (%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, [
            cart_id,
            product_id,
            quantity,
            observations,
            json.dumps(variant_selection),
            unit_price
        ])

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