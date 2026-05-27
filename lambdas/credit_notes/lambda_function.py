# lambdas/credit_debit_notes/lambda_function.py

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
from shared.schemas import validate_create_note


def handler(event, context):
    method = event["requestContext"]["http"]["method"]

    user, error = require_auth(event)
    if error:
        return error

    try:
        path_params = event.get("pathParameters") or {}
        note_id = path_params.get("id")

        # POST /notes
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            return create_note(user, body)

        # GET /notes/{id}
        elif method == "GET" and note_id:
            return get_note(user, note_id)

        # GET /notes
        elif method == "GET":
            params = event.get("queryStringParameters") or {}
            return list_notes(user, params)

        else:
            return bad_request("Método no permitido")

    except Exception as e:
        print(f"Error en lambda_credit_debit_notes: {str(e)}")
        return server_error()


def create_note(user, body):
    """
    Crea una nota de crédito o débito
    y genera automáticamente el movimiento
    en cuenta corriente.
    """

    error = validate_create_note(body)
    if error:
        return bad_request(error)

    user_id      = body["user_id"]
    company_id   = body["company_id"]
    note_type    = body["type"]       # credit | debit
    reason       = body["reason"]
    amount       = float(body["amount"])
    reference_id = body.get("reference_id")
    notes        = body.get("notes", "")

    conn = get_connection()
    cur  = conn.cursor()

    try:
        note_id = str(uuid.uuid4())

        # Creamos la nota
        cur.execute("""
            INSERT INTO credit_debit_notes (
                id,
                user_id,
                company_id,
                type,
                reason,
                amount,
                reference_id,
                notes,
                created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, [
            note_id,
            user_id,
            company_id,
            note_type,
            reason,
            amount,
            reference_id,
            notes,
            user["id"]
        ])

        # Definimos impacto financiero
        # Crédito = disminuye deuda
        # Débito  = aumenta deuda
        movement_amount = -amount if note_type == "credit" else amount

        movement_type = (
            "credit_note"
            if note_type == "credit"
            else "debit_note"
        )

        description = (
            f"Nota de crédito - {reason}"
            if note_type == "credit"
            else f"Nota de débito - {reason}"
        )

        # Movimiento en cuenta corriente
        cur.execute("""
            INSERT INTO account_movements (
                user_id,
                company_id,
                type,
                reference_id,
                description,
                amount
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, [
            user_id,
            company_id,
            movement_type,
            note_id,
            description,
            movement_amount
        ])

        # Si es cheque rechazado:
        # revertimos comisión para evitar duplicados
        if reason == "rejected_check" and reference_id:

            cur.execute("""
                UPDATE commissions
                SET is_reversed = true
                WHERE order_id = %s
            """, [reference_id])

        conn.commit()

        return created({
            "note_id": note_id,
            "type": note_type,
            "amount": amount
        })

    except Exception as e:
        conn.rollback()
        print(f"Error creando nota: {str(e)}")
        return server_error()

    finally:
        cur.close()


def list_notes(user, params):
    """
    Lista notas de crédito/débito.
    """

    company_id = params.get("company_id")
    user_id    = params.get("user_id")
    note_type  = params.get("type")

    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            n.id,
            n.user_id,
            u.full_name,
            n.company_id,
            c.name,
            n.type,
            n.reason,
            n.amount,
            n.notes,
            n.created_at
        FROM credit_debit_notes n
        INNER JOIN users u
            ON n.user_id = u.id
        INNER JOIN companies c
            ON n.company_id = c.id
        WHERE 1=1
    """

    args = []

    if company_id:
        query += " AND n.company_id = %s"
        args.append(company_id)

    if user_id:
        query += " AND n.user_id = %s"
        args.append(user_id)

    if note_type:
        query += " AND n.type = %s"
        args.append(note_type)

    query += " ORDER BY n.created_at DESC"

    cur.execute(query, args)

    rows = cur.fetchall()
    cur.close()

    notes = [
        {
            "id": str(row[0]),
            "user_id": str(row[1]),
            "user_name": row[2],
            "company_id": str(row[3]),
            "company_name": row[4],
            "type": row[5],
            "reason": row[6],
            "amount": float(row[7]),
            "notes": row[8],
            "created_at": str(row[9])
        }
        for row in rows
    ]

    return success(notes)


def get_note(user, note_id):
    """
    Devuelve detalle de una nota.
    """

    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            n.id,
            n.user_id,
            u.full_name,
            n.company_id,
            c.name,
            n.type,
            n.reason,
            n.amount,
            n.reference_id,
            n.notes,
            n.created_at
        FROM credit_debit_notes n
        INNER JOIN users u
            ON n.user_id = u.id
        INNER JOIN companies c
            ON n.company_id = c.id
        WHERE n.id = %s
    """, [note_id])

    row = cur.fetchone()

    cur.close()

    if not row:
        return not_found("Nota no encontrada")

    return success({
        "id": str(row[0]),
        "user_id": str(row[1]),
        "user_name": row[2],
        "company_id": str(row[3]),
        "company_name": row[4],
        "type": row[5],
        "reason": row[6],
        "amount": float(row[7]),
        "reference_id": str(row[8]) if row[8] else None,
        "notes": row[9],
        "created_at": str(row[10])
    })