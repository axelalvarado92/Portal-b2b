import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
import uuid

from shared.db import get_connection
from shared.auth_utils import require_auth
from shared.utils import (
    success,
    created,
    bad_request,
    not_found,
    server_error
)

from shared.schemas import validate_create_invoice


IVA_PERCENTAGE = 21


def handler(event, context):

    method = event["requestContext"]["http"]["method"]

    user, error = require_auth(event)

    if error:
        return error

    try:

        path_params = event.get("pathParameters") or {}
        invoice_id  = path_params.get("id")

        # POST /invoices
        if method == "POST":

            body = json.loads(event.get("body") or "{}")
            return create_invoice(user, body)

        # GET /invoices/{id}
        elif method == "GET" and invoice_id:

            return get_invoice(user, invoice_id)

        # GET /invoices
        elif method == "GET":

            params = event.get("queryStringParameters") or {}
            return list_invoices(user, params)

        else:
            return bad_request("Método no permitido")

    except Exception as e:

        print(f"Error en lambda_invoices: {str(e)}")
        return server_error()


def create_invoice(user, body):

    error = validate_create_invoice(body)

    if error:
        return bad_request(error)

    order_id                = body["order_id"]
    external_invoice_number = body["external_invoice_number"]
    items                   = body["items"]

    conn = get_connection()
    cur  = conn.cursor()

    try:

        # Verificamos pedido
        cur.execute("""
            SELECT
                o.id,
                o.user_id,
                o.company_id
            FROM orders o
            WHERE o.id = %s
        """, [order_id])

        order = cur.fetchone()

        if not order:
            return not_found("Pedido no encontrado")

        user_id    = order[1]
        company_id = order[2]

        subtotal_amount = 0

        validated_items = []

        # Validamos items
        for item in items:

            order_item_id       = item["order_item_id"]
            invoiced_unit_price = float(item["invoiced_unit_price"])

            cur.execute("""
                SELECT
                    oi.id,
                    oi.product_name,
                    oi.quantity,
                    oi.unit_price,
                    oi.is_billable
                FROM order_items oi
                WHERE oi.id = %s
            """, [order_item_id])

            row = cur.fetchone()

            if not row:
                return bad_request(
                    f"Item inexistente: {order_item_id}"
                )

            # Verificamos si ya fue facturado
            cur.execute("""
                SELECT 1
                FROM invoice_items
                WHERE order_item_id = %s
            """, [order_item_id])

            already_invoiced = cur.fetchone()

            if already_invoiced:
                return bad_request(
                    f"El item ya fue facturado: {row[1]}"
                )

            if row[4] is False:
                return bad_request(
                    f"El item no es facturable: {row[1]}"
                )

            quantity = float(row[2])

            subtotal = invoiced_unit_price * quantity

            subtotal_amount += subtotal

            validated_items.append({
                "order_item_id": row[0],
                "product_name": row[1],
                "quantity": quantity,
                "original_unit_price": float(row[3]),
                "invoiced_unit_price": invoiced_unit_price,
                "subtotal": subtotal
            })

        tax_amount = subtotal_amount * (IVA_PERCENTAGE / 100)

        total_amount = subtotal_amount + tax_amount

        invoice_id = str(uuid.uuid4())

        # Creamos factura
        cur.execute("""
            INSERT INTO invoices (
                id,
                order_id,
                user_id,
                company_id,
                external_invoice_number,
                subtotal_amount,
                tax_amount,
                total_amount
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, [
            invoice_id,
            order_id,
            user_id,
            company_id,
            external_invoice_number,
            subtotal_amount,
            tax_amount,
            total_amount
        ])

        # Items facturados
        for item in validated_items:

            cur.execute("""
                INSERT INTO invoice_items (
                    invoice_id,
                    order_item_id,
                    product_name,
                    quantity,
                    original_unit_price,
                    invoiced_unit_price,
                    subtotal_amount
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [
                invoice_id,
                item["order_item_id"],
                item["product_name"],
                item["quantity"],
                item["original_unit_price"],
                item["invoiced_unit_price"],
                item["subtotal"]
            ])

        # Marcamos pedido como facturado
        cur.execute("""
            UPDATE orders
            SET
                invoiced_at = now(),
                external_invoice_number = %s
            WHERE id = %s
        """, [
            external_invoice_number,
            order_id
        ])

        conn.commit()

        return created({
            "invoice_id": invoice_id,
            "subtotal_amount": subtotal_amount,
            "tax_amount": tax_amount,
            "total_amount": total_amount
        })

    except Exception as e:

        conn.rollback()

        print(f"Error creando factura: {str(e)}")
        return server_error()

    finally:
        cur.close()


def list_invoices(user, params):

    company_id = params.get("company_id")
    user_id    = params.get("user_id")

    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            i.id,
            i.order_id,
            i.external_invoice_number,
            i.subtotal_amount,
            i.tax_amount,
            i.total_amount,
            i.created_at,
            c.name,
            u.full_name
        FROM invoices i
        INNER JOIN companies c
            ON i.company_id = c.id
        INNER JOIN users u
            ON i.user_id = u.id
        WHERE 1=1
    """

    args = []

    if company_id:
        query += " AND i.company_id = %s"
        args.append(company_id)

    if user_id:
        query += " AND i.user_id = %s"
        args.append(user_id)

    query += " ORDER BY i.created_at DESC"

    cur.execute(query, args)

    rows = cur.fetchall()

    cur.close()

    invoices = [
        {
            "id": str(row[0]),
            "order_id": str(row[1]),
            "external_invoice_number": row[2],
            "subtotal_amount": float(row[3]),
            "tax_amount": float(row[4]),
            "total_amount": float(row[5]),
            "created_at": str(row[6]),
            "company_name": row[7],
            "user_name": row[8]
        }
        for row in rows
    ]

    return success(invoices)


def get_invoice(user, invoice_id):

    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            i.id,
            i.order_id,
            i.external_invoice_number,
            i.subtotal_amount,
            i.tax_amount,
            i.total_amount,
            i.created_at,
            c.name,
            u.full_name
        FROM invoices i
        INNER JOIN companies c
            ON i.company_id = c.id
        INNER JOIN users u
            ON i.user_id = u.id
        WHERE i.id = %s
    """, [invoice_id])

    invoice = cur.fetchone()

    if not invoice:
        return not_found("Factura no encontrada")

    cur.execute("""
        SELECT
            product_name,
            quantity,
            original_unit_price,
            invoiced_unit_price,
            subtotal_amount
        FROM invoice_items
        WHERE invoice_id = %s
    """, [invoice_id])

    item_rows = cur.fetchall()

    cur.close()

    items = [
        {
            "product_name": row[0],
            "quantity": float(row[1]),
            "original_unit_price": float(row[2]),
            "invoiced_unit_price": float(row[3]),
            "subtotal_amount": float(row[4])
        }
        for row in item_rows
    ]

    return success({
        "id": str(invoice[0]),
        "order_id": str(invoice[1]),
        "external_invoice_number": invoice[2],
        "subtotal_amount": float(invoice[3]),
        "tax_amount": float(invoice[4]),
        "total_amount": float(invoice[5]),
        "created_at": str(invoice[6]),
        "company_name": invoice[7],
        "user_name": invoice[8],
        "items": items
    })