# lambdas/orders/lambda_function.py

import sys
import os
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
import uuid
import boto3

from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import success, created, bad_request, not_found, server_error
from shared.schemas import validate_create_order

sqs = boto3.client("sqs")

QUEUE_URL = os.environ["QUEUE_URL"]


def create_order(user, body):

    customer_notes = body.get("customer_notes", "")

    error = validate_create_order(body)

    if error:
        return bad_request(error)

    company_id = body["company_id"]
    cart_id    = body["cart_id"]
    notes      = body.get("notes", "")

    conn = get_connection()
    cur  = conn.cursor()

    try:

        # Verificamos que el carrito exista, sea del usuario y esté abierto
        cur.execute("""
            SELECT id FROM carts
            WHERE id         = %s
              AND user_id    = %s
              AND company_id = %s
              AND status     = 'OPEN'
        """, [cart_id, user["id"], company_id])

        if not cur.fetchone():
            return not_found("Carrito no encontrado o ya fue procesado")

        # Traemos los items del carrito con precio actual
        cur.execute("""
            SELECT
                ci.product_id,
                p.name,
                ci.unit_price,
                ci.quantity,
                ci.observations,
                ci.variant_selection
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = %s
        """, [cart_id])

        items = cur.fetchall()

        if not items:
            return bad_request("El carrito está vacío")

        # Calculamos el total
        total = sum(float(row[2]) * float(row[3]) for row in items)

        # Creamos el pedido
        order_id = str(uuid.uuid4())

        cur.execute("""
            INSERT INTO orders (
                id,
                user_id,
                company_id,
                cart_id,
                total_amount,
                status,
                notes,
                customer_notes
            )
            VALUES (%s, %s, %s, %s, %s, 'PENDING', %s, %s)
        """, [
            order_id,
            user["id"],
            company_id,
            cart_id,
            total,
            notes,
            customer_notes
        ])

        # Creamos los items del pedido
        # Guardamos nombre y precio al momento del pedido
        for row in items:

            product_id, product_name, unit_price, quantity, observations, variant_selection = row

            subtotal = float(unit_price) * float(quantity)

            cur.execute("""
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    product_name,
                    unit_price,
                    quantity,
                    subtotal,
                    observations,
                    variant_selection
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                    order_id,
                    product_id,
                    product_name,
                    unit_price,
                    quantity,
                    subtotal,
                    observations,
                    json.dumps(variant_selection)
                ])

        # Cerramos el carrito
        cur.execute("""
            UPDATE carts
            SET status = 'CLOSED'
            WHERE id = %s
        """, [cart_id])

        conn.commit()

        # Disparamos el worker de notificaciones via SQS
        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps({
                "event":      "ORDER_CREATED",
                "order_id":   order_id,
                "company_id": company_id,
                "user_id":    user["id"]
            })
        )

        return created({
            "order_id": order_id,
            "total":    round(total, 2),
            "status":   "PENDING"
        })

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

        cur.close()


def list_orders(user, params):

    company_id = params.get("company_id")

    conn = get_connection()
    cur  = conn.cursor()

    try:

        query = """
            SELECT 
                o.id,
                o.company_id,
                c.name AS company_name,
                o.total_amount,
                o.status,
                o.notes,
                o.created_at
            FROM orders o
            INNER JOIN companies c ON o.company_id = c.id
            WHERE o.user_id = %s
        """

        args = [user["id"]]

        if company_id:
            query += " AND o.company_id = %s"
            args.append(company_id)

        query += " ORDER BY o.created_at DESC"

        cur.execute(query, args)

        rows = cur.fetchall()

        orders = [
            {
                "id":           str(row[0]),
                "company_id":   str(row[1]),
                "company_name": row[2],
                "total_amount": float(row[3]),
                "status":       row[4],
                "notes":        row[5],
                "created_at":   str(row[6])
            }
            for row in rows
        ]

        return success(orders)

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

        cur.close()


def get_order(user, order_id):

    conn = get_connection()
    cur  = conn.cursor()

    try:

        cur.execute("""
            SELECT 
                o.id,
                o.company_id,
                c.name AS company_name,
                o.total_amount,
                o.status,
                o.notes,
                o.created_at
            FROM orders o
            INNER JOIN companies c ON o.company_id = c.id
            WHERE o.id      = %s
              AND o.user_id = %s
        """, [order_id, user["id"]])

        row = cur.fetchone()

        if not row:
            return not_found("Pedido no encontrado")

        # Traemos los items del pedido
        cur.execute("""
            SELECT 
                oi.product_id,
                oi.product_name,
                oi.unit_price,
                oi.quantity,
                oi.subtotal,
                oi.observations,
                oi.variant_selection,
                pv.sku AS variant_sku
            FROM order_items oi
            LEFT JOIN product_variants pv
                ON pv.id = (oi.variant_selection->>'variant_id')::uuid
            WHERE oi.order_id = %s
        """, [order_id])

        item_rows = cur.fetchall()

        items = [
            {
                "product_id": str(item[0]),
                "product_name": item[1],
                "unit_price": float(item[2]),
                "quantity": float(item[3]),
                "subtotal": float(item[4]),
                "observations": item[5],
                "variant_selection": item[6] if item[6] else {},
                "variant_sku": item[7]  # ← AGREGAR ESTA LÍNEA
            }
            for item in item_rows
        ]

        return success({
            "id":           str(row[0]),
            "company_id":   str(row[1]),
            "company_name": row[2],
            "total_amount": float(row[3]),
            "status":       row[4],
            "notes":        row[5],
            "created_at":   str(row[6]),
            "items":        items
        })

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        return server_error()

    finally:

        cur.close()

def request_cancel_order(user, order_id):

    conn = get_connection()
    cur  = conn.cursor()

    try:

        cur.execute("""
            SELECT status FROM orders
            WHERE id = %s AND user_id = %s
        """, [order_id, user["id"]])

        row = cur.fetchone()

        if not row:
            return not_found("Pedido no encontrado")

        current_status = row[0]

        if current_status != "PENDING":
            return bad_request("Solo se puede solicitar cancelación de pedidos pendientes")

        cur.execute("""
            UPDATE orders
            SET status = 'CANCEL_REQUESTED'
            WHERE id = %s
        """, [order_id])

        conn.commit()

        return success({"message": "Cancelación solicitada"})

    except Exception:
        conn.rollback()
        print(traceback.format_exc())
        return server_error()

    finally:
        cur.close()

def handler(event, context):

    method = event["requestContext"]["http"]["method"]

    user, error = require_auth(event)

    if error:
        return error

    try:

        path_params = event.get("pathParameters") or {}
        order_id    = path_params.get("id")
        path        = event["requestContext"]["http"]["path"]


        # POST /orders
        if method == "POST":

            body = json.loads(event.get("body") or "{}")

            return create_order(user, body)
        
        # PATCH /orders/{id}/request-cancel
        elif method == "PATCH" and order_id and path.endswith("/request-cancel"):
            
            return request_cancel_order(user, order_id)


        # GET /orders/{id}
        elif method == "GET" and order_id:

            return get_order(user, order_id)

        # GET /orders
        elif method == "GET":

            params = event.get("queryStringParameters") or {}

            return list_orders(user, params)

        else:

            return bad_request("Método no permitido")

    except Exception:

        print(traceback.format_exc())

        return server_error()