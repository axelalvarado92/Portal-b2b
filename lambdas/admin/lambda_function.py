import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
import boto3
import uuid

from shared.db import get_connection
from shared.auth_utils import require_admin
from shared.utils import success, created, bad_request, not_found, server_error
from shared.schemas import (
    validate_create_user,
    validate_create_company,
    validate_update_company,
    validate_create_product,
    validate_update_product
)

cognito = boto3.client("cognito-idp")
USER_POOL_ID = os.environ["USER_POOL_ID"]

# =========================================================
# USERS
# =========================================================

def list_users():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, email, full_name, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()

    return success([
        {
            "id": str(r[0]),
            "email": r[1],
            "full_name": r[2],
            "role": r[3],
            "is_active": r[4],
            "created_at": str(r[5])
        }
        for r in rows
    ])


def create_user(body):
    error = validate_create_user(body)
    if error:
        return bad_request(error)

    email = body["email"]
    full_name = body["full_name"]
    role = body["role"]
    companies = body.get("companies", [])

    if role not in ["admin", "customer"]:
        return bad_request("Rol inválido")

    # ─────────────────────────────
    # 1. Crear usuario en Cognito
    # ─────────────────────────────
    try:
        response = cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "name", "Value": full_name},
                {"Name": "custom:role", "Value": role},
                {"Name": "email_verified", "Value": "true"}
            ],
            DesiredDeliveryMediums=["EMAIL"]
        )

        cognito_sub = next(
            a["Value"]
            for a in response["User"]["Attributes"]
            if a["Name"] == "sub"
        )

    except cognito.exceptions.UsernameExistsException:
        return bad_request("Usuario ya existe en Cognito")

    # ─────────────────────────────
    # 2. Persistir en Postgres (users)
    # ─────────────────────────────
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO users (
                id,
                email,
                full_name,
                role,
                is_active
            )
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE
            SET email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role
        """, [
            cognito_sub,
            email,
            full_name,
            role,
            True
        ])

        # ─────────────────────────────
        # 3. Relación con companies
        # ─────────────────────────────
        for company_id in companies:
            cur.execute("""
                INSERT INTO user_companies (user_id, company_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, [cognito_sub, company_id])

        conn.commit()

    except Exception as e:
        conn.rollback()

        # rollback cognito si falla DB (opcional pero recomendado)
        try:
            cognito.admin_delete_user(
                UserPoolId=USER_POOL_ID,
                Username=email
            )
        except:
            pass

        raise e

    finally:
        cur.close()

    return created({
        "id": cognito_sub,
        "email": email,
        "full_name": full_name,
        "role": role
    })


def update_user(user_id, body):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE id = %s", [user_id])
    if not cur.fetchone():
        return not_found("Usuario no encontrado")

    # is_active
    if "is_active" in body:
        is_active = body["is_active"]

        cur.execute("""
            UPDATE users SET is_active = %s WHERE id = %s
        """, [is_active, user_id])

        if is_active:
            cognito.admin_enable_user(UserPoolId=USER_POOL_ID, Username=user_id)
        else:
            cognito.admin_disable_user(UserPoolId=USER_POOL_ID, Username=user_id)

    # role
    if "role" in body:
        role = body["role"]

        if role not in ["admin", "customer"]:
            return bad_request("Rol inválido")

        cur.execute("""
            UPDATE users SET role = %s WHERE id = %s
        """, [role, user_id])

        cognito.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=user_id,
            UserAttributes=[
                {"Name": "custom:role", "Value": role}
            ]
        )

    # companies
    if "companies" in body:
        companies = body["companies"]

        cur.execute("""
            DELETE FROM user_companies WHERE user_id = %s
        """, [user_id])

        for company_id in companies:
            cur.execute("""
                INSERT INTO user_companies (user_id, company_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, [user_id, company_id])

    conn.commit()
    cur.close()

    return success({"message": "Usuario actualizado"})


# =========================================================
# COMPANIES
# =========================================================

def list_companies():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, logo_url, description, contact_email,
               is_active, notification_emails, whatsapp_phone, created_at
        FROM companies
        ORDER BY name ASC
    """)

    rows = cur.fetchall()
    cur.close()

    return success([
        {
            "id": str(r[0]),
            "name": r[1],
            "logo_url": r[2],
            "description": r[3],
            "contact_email": r[4],
            "is_active": r[5],
            "notification_emails": r[6] or [],
            "whatsapp_phone": r[7],
            "created_at": str(r[8])
        }
        for r in rows
    ])


def create_company(body):
    error = validate_create_company(body)
    if error:
        return bad_request(error)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO companies
        (name, logo_url, description, contact_email, notification_emails, whatsapp_phone)
        VALUES (%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, [
        body["name"],
        body.get("logo_url"),
        body.get("description"),
        body["contact_email"],
        body.get("notification_emails", []),
        body.get("whatsapp_phone")
    ])

    company_id = cur.fetchone()[0]

    conn.commit()
    cur.close()

    return created({"id": str(company_id)})


def update_company(company_id, body):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM companies WHERE id = %s", [company_id])
    if not cur.fetchone():
        return not_found("Empresa no encontrada")

    allowed = [
        "name", "logo_url", "description", "contact_email",
        "is_active", "notification_emails", "whatsapp_phone"
    ]

    updates = []
    args = []

    for f in allowed:
        if f in body:
            updates.append(f"{f} = %s")
            args.append(body[f])

    args.append(company_id)

    cur.execute(f"""
        UPDATE companies SET {', '.join(updates)}
        WHERE id = %s
    """, args)

    conn.commit()
    cur.close()

    return success({"message": "Empresa actualizada"})


# =========================================================
# PRODUCTS
# =========================================================

def list_products(params):
    company_id = params.get("company_id")

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT p.id, p.code, p.name, p.price, p.is_active,
               p.unit_type, p.has_stock, p.stock_quantity,
               c.name
        FROM products p
        INNER JOIN companies c ON p.company_id = c.id
    """

    args = []

    if company_id:
        query += " WHERE p.company_id = %s"
        args.append(company_id)

    cur.execute(query, args)
    rows = cur.fetchall()
    cur.close()

    return success([
        {
            "id": str(r[0]),
            "code": r[1],
            "name": r[2],
            "price": float(r[3]),
            "is_active": r[4],
            "unit_type": r[5],
            "has_stock": r[6],
            "stock_quantity": r[7],
            "company_name": r[8]
        }
        for r in rows
    ])


def create_product(body):
    error = validate_create_product(body)
    if error:
        return bad_request(error)

    code = body.get("code")
    if not code:
        code = f"PROD-{uuid.uuid4().hex[:8]}"

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO products
        (company_id, category_id, code, name, description, image_url, price,
         has_stock, stock_quantity, unit_type)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, [
        body["company_id"],
        body.get("category_id"),
        code,
        body["name"],
        body.get("description"),
        body.get("image_url"),
        body["price"],
        body.get("has_stock", False),
        body.get("stock_quantity"),
        body.get("unit_type", "unit")
    ])

    product_id = cur.fetchone()[0]

    conn.commit()
    cur.close()

    return created({"id": str(product_id)})


def update_product(product_id, body):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM products WHERE id = %s", [product_id])
    if not cur.fetchone():
        return not_found("Producto no encontrado")

    allowed = [
        "name", "code", "description", "image_url", "price",
        "has_stock", "stock_quantity", "unit_type", "is_active"
    ]

    updates = []
    args = []

    for f in allowed:
        if f in body:
            updates.append(f"{f} = %s")
            args.append(body[f])

    args.append(product_id)

    cur.execute(f"""
        UPDATE products SET {', '.join(updates)}, updated_at = now()
        WHERE id = %s
    """, args)

    conn.commit()
    cur.close()

    return success({"message": "Producto actualizado"})


def delete_product(product_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE products SET is_active = false WHERE id = %s
    """, [product_id])

    conn.commit()
    cur.close()

    return success({"message": "Producto desactivado"})


# =========================================================
# HANDLER
# =========================================================

# =========================================================
# HANDLER
# =========================================================

print("ADMIN LAMBDA VERSION 2026-05-22-FINAL")

def handler(event, context):

    method = event["requestContext"]["http"]["method"]
    path = event["requestContext"]["http"]["path"]

    print("METHOD:", method)
    print("PATH:", path)

    user, error = require_admin(event)

    if error:
        return error

    try:

        body = json.loads(event.get("body") or "{}")
        params = event.get("queryStringParameters") or {}
        path_params = event.get("pathParameters") or {}

        resource_id = path_params.get("id")

        # ==========================
        # USERS
        # ==========================

        if path.startswith("/admin/users"):

            if method == "GET" and not resource_id:
                return list_users()

            if method == "POST":
                return create_user(body)

            if method == "PATCH" and resource_id:
                return update_user(resource_id, body)

        # ==========================
        # COMPANIES
        # ==========================

        if path.startswith("/admin/companies"):

            if method == "GET":
                return list_companies()

            if method == "POST":
                return create_company(body)

            if method == "PATCH" and resource_id:
                return update_company(resource_id, body)

        # ==========================
        # PRODUCTS
        # ==========================

        if path.startswith("/admin/products"):

            if method == "GET":
                return list_products(params)

            if method == "POST":
                return create_product(body)

            if method == "PATCH" and resource_id:
                return update_product(resource_id, body)

            if method == "DELETE" and resource_id:
                return delete_product(resource_id)

        return bad_request("Ruta no encontrada")

    except Exception as e:
        print(str(e))
        return server_error()