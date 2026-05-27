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

from shared.schemas import validate_create_payment

from shared.finance import (
    create_payment_financial_record,
    calculate_user_balance
)


def handler(event, context):

    method = event["requestContext"]["http"]["method"]

    user, error = require_auth(event)

    if error:
        return error

    try:

        path_params = event.get("pathParameters") or {}
        payment_id = path_params.get("id")

        # POST /payments
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            return create_payment(user, body)

        # GET /payments/{id}
        elif method == "GET" and payment_id:
            return get_payment(user, payment_id)

        # GET /payments
        elif method == "GET":
            params = event.get("queryStringParameters") or {}
            return list_payments(user, params)

        else:
            return bad_request("Método no permitido")

    except Exception as e:
        print(f"Error en lambda_payments: {str(e)}")
        return server_error()


def create_payment(user, body):

    # SOLO ADMIN
    if user["role"] != "admin":
        return bad_request("No autorizado")

    error = validate_create_payment(body)

    if error:
        return bad_request(error)

    user_id = body["user_id"]
    company_id = body["company_id"]
    amount = float(body["amount"])

    payment_method = body["payment_method"]

    reference = body.get("reference")
    notes = body.get("notes")
    payment_date = body.get("payment_date")

    conn = get_connection()
    cur = conn.cursor()

    # Verificar cliente
    cur.execute("""
        SELECT id
        FROM users
        WHERE id = %s
          AND is_active = true
    """, [user_id])

    if not cur.fetchone():
        cur.close()
        return not_found("Cliente no encontrado")

    payment_id = str(uuid.uuid4())

    cur.execute("""
        INSERT INTO payments (
            id,
            user_id,
            company_id,
            amount,
            payment_method,
            reference,
            notes,
            created_by,
            payment_date
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, [
        payment_id,
        user_id,
        company_id,
        amount,
        payment_method,
        reference,
        notes,
        user["id"],
        payment_date
    ])

    conn.commit()
    cur.close()

    # Movimiento financiero
    create_payment_financial_record(
        payment_id=payment_id,
        user_id=user_id,
        company_id=company_id,
        amount=amount,
        payment_method=payment_method
    )

    # Saldo actualizado
    balance = calculate_user_balance(
        user_id=user_id,
        company_id=company_id
    )

    return created({
        "payment_id": payment_id,
        "amount": amount,
        "balance": balance
    })


def list_payments(user, params):

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT
            p.id,
            p.user_id,
            u.full_name,
            p.company_id,
            c.name,
            p.amount,
            p.payment_method,
            p.reference,
            p.notes,
            p.payment_date,
            p.created_at
        FROM payments p
        INNER JOIN users u
            ON p.user_id = u.id
        INNER JOIN companies c
            ON p.company_id = c.id
        WHERE 1=1
    """

    args = []

    # Cliente común solo ve sus pagos
    if user["role"] != "admin":
        query += " AND p.user_id = %s"
        args.append(user["id"])

    # Filtro opcional empresa
    company_id = params.get("company_id")

    if company_id:
        query += " AND p.company_id = %s"
        args.append(company_id)

    query += " ORDER BY p.created_at DESC"

    cur.execute(query, args)

    rows = cur.fetchall()

    cur.close()

    payments = []

    for row in rows:

        payments.append({
            "id": str(row[0]),
            "user_id": str(row[1]),
            "client_name": row[2],
            "company_id": str(row[3]),
            "company_name": row[4],
            "amount": float(row[5]),
            "payment_method": row[6],
            "reference": row[7],
            "notes": row[8],
            "payment_date": str(row[9]) if row[9] else None,
            "created_at": str(row[10])
        })

    return success(payments)


def get_payment(user, payment_id):

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT
            p.id,
            p.user_id,
            u.full_name,
            p.company_id,
            c.name,
            p.amount,
            p.payment_method,
            p.reference,
            p.notes,
            p.payment_date,
            p.created_at
        FROM payments p
        INNER JOIN users u
            ON p.user_id = u.id
        INNER JOIN companies c
            ON p.company_id = c.id
        WHERE p.id = %s
    """

    args = [payment_id]

    # Cliente común solo puede ver su pago
    if user["role"] != "admin":
        query += " AND p.user_id = %s"
        args.append(user["id"])

    cur.execute(query, args)

    row = cur.fetchone()

    cur.close()

    if not row:
        return not_found("Pago no encontrado")

    return success({
        "id": str(row[0]),
        "user_id": str(row[1]),
        "client_name": row[2],
        "company_id": str(row[3]),
        "company_name": row[4],
        "amount": float(row[5]),
        "payment_method": row[6],
        "reference": row[7],
        "notes": row[8],
        "payment_date": str(row[9]) if row[9] else None,
        "created_at": str(row[10])
    })