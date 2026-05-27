# shared/finance.py

import uuid
from decimal import Decimal
from shared.db import get_connection


def create_account_movement(
    user_id,
    company_id,
    movement_type,
    amount,
    description,
    reference_id=None
):
    """
    Crea un movimiento en cuenta corriente.

    amount:
        positivo  -> aumenta deuda
        negativo  -> reduce deuda
    """

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO account_movements (
            id,
            user_id,
            company_id,
            type,
            reference_id,
            description,
            amount
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, [
        str(uuid.uuid4()),
        user_id,
        company_id,
        movement_type,
        reference_id,
        description,
        amount
    ])

    conn.commit()
    cur.close()
    conn.close()


def calculate_user_balance(user_id, company_id=None):
    """
    Calcula saldo actual del cliente.

    positivo = deuda
    negativo = saldo a favor
    """

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT COALESCE(SUM(amount), 0)
        FROM account_movements
        WHERE user_id = %s
    """

    args = [user_id]

    if company_id:
        query += " AND company_id = %s"
        args.append(company_id)

    cur.execute(query, args)

    result = cur.fetchone()

    cur.close()
    conn.close()

    return float(result[0] or 0)


def create_commission(
    order_id,
    company_id,
    percentage,
    base_amount
):
    """
    Genera comisión para Seba.
    """

    conn = get_connection()
    cur = conn.cursor()

    # Verificamos si ya existe comisión para el pedido

    cur.execute("""
        SELECT id
        FROM commissions
        WHERE order_id = %s
    """, [order_id])
    
    existing = cur.fetchone()
    
    if existing:
        cur.close()
        conn.close()
    
        return {
            "id": str(existing[0]),
            "already_exists": True
        }    

    percentage = Decimal(str(percentage))
    base_amount = Decimal(str(base_amount))

    commission_amount = (
        base_amount * percentage / Decimal("100")
    )

    commission_id = str(uuid.uuid4())

    cur.execute("""
        INSERT INTO commissions (
            id,
            order_id,
            company_id,
            percentage,
            base_amount,
            commission_amount,
            is_reversed
        )
        VALUES (%s, %s, %s, %s, %s, %s, false)
    """, [
        commission_id,
        order_id,
        company_id,
        percentage,
        base_amount,
        commission_amount
    ])

    conn.commit()
    cur.close()
    conn.close()

    return {
        "id": commission_id,
        "commission_amount": float(commission_amount)
    }


def reverse_commission(order_id):
    """
    Marca comisión como revertida.
    Usado para:
    - cheques rechazados
    - anulaciones
    - devoluciones
    """

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE commissions
        SET is_reversed = true
        WHERE order_id = %s
    """, [order_id])

    conn.commit()
    cur.close()
    conn.close()

def get_company_commission_percentage(company_id):
    """
    Trae porcentaje de comisión configurado
    para la empresa.
    """

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT commission_percentage
        FROM companies
        WHERE id = %s
    """, [company_id])

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return 0

    return float(row[0] or 0)


def create_order_financial_records(
    order_id,
    user_id,
    company_id,
    total_amount
):
    """
    Orquesta toda la lógica financiera
    cuando se crea un pedido.

    1. Genera deuda
    2. Genera comisión
    """

    # Movimiento de deuda
    create_account_movement(
        user_id=user_id,
        company_id=company_id,
        movement_type="order",
        amount=total_amount,
        description=f"Pedido {str(order_id)[:8].upper()}",
        reference_id=order_id
    )

    # Comisión
    percentage = get_company_commission_percentage(company_id)

    if percentage > 0:
        create_commission(
            order_id=order_id,
            company_id=company_id,
            percentage=percentage,
            base_amount=total_amount
        )


def create_payment_financial_record(
    payment_id,
    user_id,
    company_id,
    amount,
    payment_method
):
    """
    Genera movimiento financiero
    cuando Seba registra un pago.
    """

    create_account_movement(
        user_id=user_id,
        company_id=company_id,
        movement_type="payment",
        amount=-abs(float(amount)),
        description=f"Pago registrado ({payment_method})",
        reference_id=payment_id
    )


def create_credit_note_financial_record(
    note_id,
    user_id,
    company_id,
    amount,
    reason
):
    """
    Reduce deuda del cliente.
    """

    create_account_movement(
        user_id=user_id,
        company_id=company_id,
        movement_type="credit_note",
        amount=-abs(float(amount)),
        description=f"Nota de crédito: {reason}",
        reference_id=note_id
    )


def create_debit_note_financial_record(
    note_id,
    user_id,
    company_id,
    amount,
    reason
):
    """
    Aumenta deuda del cliente.
    """

    create_account_movement(
        user_id=user_id,
        company_id=company_id,
        movement_type="debit_note",
        amount=abs(float(amount)),
        description=f"Nota de débito: {reason}",
        reference_id=note_id
    )