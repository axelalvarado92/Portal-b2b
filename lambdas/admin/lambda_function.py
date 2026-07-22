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
        SELECT
            u.id, u.email, u.full_name, u.phone,
            u.business_name, u.cuit, u.condicion_fiscal,
            u.direccion, u.direccion_entrega, u.direccion_transporte,
            u.ciudad, u.provincia,
            u.telefono_oficina, u.telefono_adicional,
            u.mail_adicional,
            u.role, u.is_active, u.created_at,
            c.id, c.name
        FROM users u
        LEFT JOIN user_companies uc ON uc.user_id = u.id
        LEFT JOIN companies c ON c.id = uc.company_id
        ORDER BY u.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close() # Importante cerrar conexión

    users_map = {}
    for r in rows:
        user_id = str(r[0])
        if user_id not in users_map:
            users_map[user_id] = {
                "id": user_id, "email": r[1], "full_name": r[2], "phone": r[3],
                "business_name": r[4], "cuit": r[5], "condicion_fiscal": r[6],
                "direccion": r[7], "direccion_entrega": r[8], "direccion_transporte": r[9],
                "ciudad": r[10], "provincia": r[11],
                "telefono_oficina": r[12], "telefono_adicional": r[13],
                "mail_adicional": r[14],
                "role": r[15], "is_active": r[16], "created_at": str(r[17]),
                "companies": []
            }
        if r[18] is not None:
            users_map[user_id]["companies"].append({"id": str(r[18]), "name": r[19]})

    return success(list(users_map.values()))

def create_user(body):
    error = validate_create_user(body)
    if error: return bad_request(error)
    
    email = body["email"]
    full_name = body["full_name"]
    role = body["role"]
    
    phone = body.get("phone")
    business_name = body.get("business_name")
    
    cuit = body.get("cuit")
    condicion_fiscal = body.get("condicion_fiscal")
    
    direccion = body.get("direccion")
    direccion_entrega = body.get("direccion_entrega")
    direccion_transporte = body.get("direccion_transporte")
    
    ciudad = body.get("ciudad")
    provincia = body.get("provincia")
    
    telefono_oficina = body.get("telefono_oficina")
    telefono_adicional = body.get("telefono_adicional")
    
    mail_adicional = body.get("mail_adicional")
    
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
                phone,
            
                business_name,
                cuit,
                condicion_fiscal,
            
                direccion,
                direccion_entrega,
                direccion_transporte,
            
                ciudad,
                provincia,
            
                telefono_oficina,
                telefono_adicional,
            
                mail_adicional,
            
                role,
                is_active
            
            )
            VALUES (
                %s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,
                %s,%s,
                %s,%s,
                %s,
                %s,%s
            )
            ON CONFLICT (id) DO UPDATE
            SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
            
                business_name = EXCLUDED.business_name,
                cuit = EXCLUDED.cuit,
                condicion_fiscal = EXCLUDED.condicion_fiscal,
            
                direccion = EXCLUDED.direccion,
                direccion_entrega = EXCLUDED.direccion_entrega,
                direccion_transporte = EXCLUDED.direccion_transporte,
            
                ciudad = EXCLUDED.ciudad,
                provincia = EXCLUDED.provincia,
            
                telefono_oficina = EXCLUDED.telefono_oficina,
                telefono_adicional = EXCLUDED.telefono_adicional,
            
                mail_adicional = EXCLUDED.mail_adicional,
            
                role = EXCLUDED.role
        """, [
            cognito_sub,
            email,
            full_name,
            phone,
        
            business_name,
            cuit,
            condicion_fiscal,
        
            direccion,
            direccion_entrega,
            direccion_transporte,
        
            ciudad,
            provincia,
        
            telefono_oficina,
            telefono_adicional,
        
            mail_adicional,
        
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

    cur.execute("SELECT id, cognito_sub FROM users WHERE id = %s", [user_id])
    row = cur.fetchone()
    if not row:
        return not_found("Usuario no encontrado")
    
    cognito_sub = row[1]

    # 1. Actualizar campos en Postgres (SQL Dinámico)
    # Lista de campos permitidos que vienen en el body
    allowed_fields = [
        "is_active",
        "role",
        "full_name",
        "phone",
    
        "business_name",
        "cuit",
        "condicion_fiscal",
    
        "direccion",
        "direccion_entrega",
        "direccion_transporte",
    
        "ciudad",
        "provincia",
    
        "telefono_oficina",
        "telefono_adicional",
    
        "mail_adicional"
    ]
    updates = []
    args = []

    for field in allowed_fields:
        if field in body:
            updates.append(f"{field} = %s")
            args.append(body[field])
    
    if updates:
        args.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cur.execute(query, args)

    # 2. Sincronizar atributos con Cognito
    cognito_attributes = []
    if "full_name" in body:
        cognito_attributes.append({"Name": "name", "Value": body["full_name"]})
    if "phone" in body:
        cognito_attributes.append({"Name": "phone_number", "Value": body["phone"]})
    if "role" in body:
        cognito_attributes.append({"Name": "custom:role", "Value": body["role"]})

    if cognito_attributes:
      cognito.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=cognito_sub,
            UserAttributes=cognito_attributes
        )

    # 3. Lógica específica de estados (disable/enable)
    if "is_active" in body:
        if body["is_active"]:
            cognito.admin_enable_user(UserPoolId=USER_POOL_ID, Username=cognito_sub)
        else:
            cognito.admin_disable_user(UserPoolId=USER_POOL_ID, Username=cognito_sub)

    # 4. Lógica de empresas (esto ya lo tenías)
    if "companies" in body:
        cur.execute("DELETE FROM user_companies WHERE user_id = %s", [user_id])
        for company_id in body["companies"]:
            cur.execute("INSERT INTO user_companies (user_id, company_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", [user_id, company_id])

    conn.commit()
    cur.close()
    return success({"message": "Usuario actualizado"})


# =========================================================
# COMPANIES
# =========================================================

def list_companies():
    conn = get_connection()
    cur = conn.cursor()
    # Si esta función debe listar TODAS las empresas para el admin, quita el WHERE user_id
    cur.execute("""
        SELECT id, name, logo_url, description, contact_email, 
               nombre_fantasia, cuit, condicion_fiscal, direccion, 
               ciudad, provincia, telefono_oficina, telefono_adicional, mail_adicional
        FROM companies
        ORDER BY name ASC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return success([
        {
            "id": str(r[0]), "name": r[1], "logo_url": r[2], "description": r[3],
            "contact_email": r[4], "nombre_fantasia": r[5], "cuit": r[6],
            "condicion_fiscal": r[7], "direccion": r[8], "ciudad": r[9],
            "provincia": r[10], "telefono_oficina": r[11],
            "telefono_adicional": r[12], "mail_adicional": r[13]
        } for r in rows
    ])

def create_company(body):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO companies (
            name, business_name, tax_id, logo_url, description, contact_email, 
            notification_emails, whatsapp_phone, nombre_fantasia, cuit, 
            condicion_fiscal, direccion, ciudad, provincia, telefono_oficina, 
            telefono_adicional, mail_adicional
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, [
        body["name"], body.get("business_name"), body.get("tax_id"), body.get("logo_url"),
        body.get("description"), body.get("contact_email"), body.get("notification_emails", []),
        body.get("whatsapp_phone"), body.get("nombre_fantasia"), body.get("cuit"),
        body.get("condicion_fiscal"), body.get("direccion"), body.get("ciudad"),
        body.get("provincia"), body.get("telefono_oficina"), body.get("telefono_adicional"),
        body.get("mail_adicional")
    ])
    company_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return created({"id": str(company_id)})

def update_company(company_id, body):

    conn = get_connection()
    cur = conn.cursor()
    # CORRECCIÓN: Se agregó la coma faltante en la lista 'allowed'
    allowed = [
        "name", "business_name", "tax_id", "logo_url", "description", 
        "contact_email", "is_active", "notification_emails", "whatsapp_phone",
        "nombre_fantasia", "cuit", "condicion_fiscal", "direccion", 
        "ciudad", "provincia", "telefono_oficina", "telefono_adicional", "mail_adicional"
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
    
    if cur.rowcount == 0:
        cur.close()
        return error("Empresa no encontrada", 404)

    cur.close()
    conn.close() # No olvides cerrar la conexión también

    return success({"message": "Empresa actualizada"})

def get_company(company_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT

            id,
            name,
            business_name,
            tax_id,

            nombre_fantasia,
            condicion_fiscal,

            logo_url,
            description,

            contact_email,
            mail_adicional,

            direccion,

            ciudad,
            provincia,

            telefono_oficina,
            telefono_adicional,

            whatsapp_phone,

            notification_emails,

            is_active

        FROM companies

        WHERE id=%s

    """, [company_id])

    row = cur.fetchone()

    cur.close()

    if not row:
        return not_found("Empresa no encontrada")

    return success({

        "id": str(row[0]),

        "name": row[1],

        "business_name": row[2],

        "tax_id": row[3],

        "nombre_fantasia": row[4],

        "condicion_fiscal": row[5],

        "logo_url": row[6],

        "description": row[7],

        "contact_email": row[8],

        "mail_adicional": row[9],

        "direccion": row[10],

        "ciudad": row[11],

        "provincia": row[12],

        "telefono_oficina": row[13],

        "telefono_adicional": row[14],

        "whatsapp_phone": row[15],

        "notification_emails": row[16],

        "is_active": row[17]

    })

def delete_company(company_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE companies SET is_active = false WHERE id = %s
    """, [company_id])

    conn.commit()

    if cur.rowcount == 0:
        cur.close()
        return not_found("Empresa no encontrada")

    cur.close()
    conn.close()

    return success({"message": "Empresa desactivada"})

# =========================================================
# PRODUCTS
# =========================================================

def list_products(params):
    company_id = params.get("company_id")
    page = int(params.get("page", 1))
    limit = int(params.get("limit", 12))
    offset = (page - 1) * limit

    conn = get_connection()
    cur = conn.cursor()

    count_query = "SELECT COUNT(*) FROM products"
    count_args = []
    if company_id:
        count_query += " WHERE company_id = %s"
        count_args.append(company_id)
    cur.execute(count_query, count_args)
    total = cur.fetchone()[0]

    query = """
        SELECT p.id,
               p.code,
               p.name,
               p.price,
               p.is_active,
               p.unit_type,
               p.has_stock,
               p.stock_quantity,
               p.image_url,
               c.name
        FROM products p
        INNER JOIN companies c
            ON p.company_id = c.id
    """

    args = []
    if company_id:
        query += " WHERE p.company_id = %s"
        args.append(company_id)

    query += " ORDER BY p.name LIMIT %s OFFSET %s"
    args.append(limit)
    args.append(offset)

    cur.execute(query, args)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    products = [
        {
            "id": str(r[0]),
            "code": r[1],
            "name": r[2],
            "price": float(r[3]),
            "is_active": r[4],
            "unit_type": r[5],
            "has_stock": r[6],
            "stock_quantity": r[7],
            "image_url": r[8],
            "company_name": r[9]
        }
        for r in rows
    ]

    return success({
        "products": products,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit
    })

def get_product(product_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, code, name, description, image_url, price,
               is_active, unit_type, has_stock, stock_quantity, category_id, company_id
        FROM products
        WHERE id = %s
    """, [product_id])
    row = cur.fetchone()
    cur.close()
    if not row:
        return not_found("Producto no encontrado")
    return success({
        "id": str(row[0]),
        "code": row[1],
        "name": row[2],
        "description": row[3],
        "image_url": row[4],
        "price": float(row[5]),
        "is_active": row[6],
        "unit_type": row[7],
        "has_stock": row[8],
        "stock_quantity": row[9],
        "category_id": str(row[10]) if row[10] else None,
        "company_id": str(row[11]) if row[11] else None
    })

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
    print("DEBUG: Body recibido en el update:", body)
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
        # SOLO agregamos al UPDATE si el valor no es None
        # O si realmente quieres permitir borrar datos, mantén el 'if f in body'
        if f in body and body[f] is not None: 
            updates.append(f"{f} = %s")
            args.append(body[f])

    args.append(product_id)

    # Agregamos un log para ver qué SQL se está ejecutando realmente
    sql_query = f"UPDATE products SET {', '.join(updates)}, updated_at = now() WHERE id = %s"
    print("DEBUG: SQL a ejecutar:", sql_query)
    print("DEBUG: Argumentos:", args)

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

print("ADMIN LAMBDA VERSION 2026-05-22-FINAL")

# =========================================================
# ORDERS
# =========================================================

def list_orders():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            o.id,
            c.name,
            u.email,
            o.total_amount,
            o.status,
            o.created_at
        FROM orders o
        INNER JOIN companies c
            ON o.company_id = c.id
        INNER JOIN users u
            ON o.user_id = u.id
        ORDER BY o.created_at DESC
    """)

    rows = cur.fetchall()

    cur.close()

    return success([
        {
            "id": str(r[0]),
            "company_name": r[1],
            "customer_email": r[2],
            "total_amount": float(r[3]),
            "status": r[4],
            "created_at": str(r[5])
        }
        for r in rows
    ])

def get_order_admin(order_id):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            SELECT
                o.id,
                u.full_name,
                u.email,
                c.name,
                o.status,
                o.total_amount,
                o.notes,
                o.created_at
            FROM orders o
            INNER JOIN users u
                ON o.user_id = u.id
            INNER JOIN companies c
                ON o.company_id = c.id
            WHERE o.id = %s
        """, [order_id])

        order = cur.fetchone()

        if not order:
            return not_found(
                "Pedido no encontrado"
            )

        cur.execute("""
            SELECT
                product_name,
                quantity,
                unit_price,
                subtotal,
                observations
            FROM order_items
            WHERE order_id = %s
        """, [order_id])

        rows = cur.fetchall()

        items = [
            {
                "product_name": row[0],
                "quantity": float(row[1]),
                "unit_price": float(row[2]),
                "subtotal": float(row[3]),
                "observations": row[4]
            }
            for row in rows
        ]

        return success({
            "id": str(order[0]),
            "customer_name": order[1],
            "customer_email": order[2],
            "company_name": order[3],
            "status": order[4],
            "total_amount": float(order[5]),
            "notes": order[6],
            "created_at": str(order[7]),
            "items": items
        })

    except Exception as e:

        print(str(e))
        return server_error()

    finally:

        cur.close()
        conn.close()

def update_order_status(order_id, status):
    conn = get_connection()
    cur = conn.cursor()

    try:
        # 💡 Dejamos order_id como el string que viene de Axios, 
        # y le agregamos '::uuid' en el SQL para que Postgres lo convierta nativamente.
        cur.execute("""
            UPDATE orders
            SET status = %s
            WHERE id = %s::uuid
        """, [status, order_id])

        conn.commit()

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,GET,PUT"
            },
            "body": json.dumps({
                "message": "Estado del pedido actualizado correctamente",
                "status": status
            })
        }

    except Exception as e:
        print("ERROR EN ENRUTAMIENTO O POSTGRESQL:", str(e))
        conn.rollback()
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,GET,PUT"
            },
            "body": json.dumps({"error": str(e)})
        }

    finally:
        cur.close()
        conn.close()

def list_account_requests():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            SELECT
                id,
                full_name,
                email,
                phone,
                business_name,
                delivery_method,
                carrier_name,
                carrier_phone,
                delivery_address,
                status,
                created_at,
                mail_adicional,
                telefono_oficina,
                telefono_adicional,
                cuit,
                condicion_fiscal,
                direccion,
                ciudad,
                provincia,
                direccion_transporte
            FROM account_requests
            ORDER BY created_at DESC
        """)

        rows = cur.fetchall()

        requests = []

        for row in rows:
            requests.append({
                "id": str(row[0]),
                "full_name": row[1],
                "email": row[2],
                "phone": row[3],
                "business_name": row[4],
                "delivery_method": row[5],
                "carrier_name": row[6],
                "carrier_phone": row[7],
                "delivery_address": row[8],
                "status": row[9],
                "created_at": row[10].isoformat() if row[10] else None,
                "mail_adicional": row[11],
                "telefono_oficina": row[12],
                "telefono_adicional": row[13],
                "cuit": row[14],
                "condicion_fiscal": row[15],
                "direccion": row[16],
                "ciudad": row[17],
                "provincia": row[18],
                "direccion_transporte": row[19]
            })

        return success(requests)

    finally:
        cur.close()
        conn.close()

def approve_account_request(request_id, body):

    companies = body.get("companies", [])
    role = body.get("role", "customer")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            full_name, email, phone, business_name,
            delivery_method, carrier_name, carrier_phone, delivery_address,
            mail_adicional, telefono_oficina, telefono_adicional,
            cuit, condicion_fiscal, direccion, ciudad, provincia,
            direccion_transporte, status
        FROM account_requests
        WHERE id = %s
    """, [request_id])

    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return not_found("Solicitud no encontrada")

    (
        full_name, email, phone, business_name,
        delivery_method, carrier_name, carrier_phone, delivery_address,
        mail_adicional, telefono_oficina, telefono_adicional,
        cuit, condicion_fiscal, direccion, ciudad, provincia,
        direccion_transporte, status
    ) = row

    if status == "approved":
        cur.close()
        conn.close()
        return bad_request("Esta solicitud ya fue aprobada")

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
        cur.close()
        conn.close()
        return bad_request("Ya existe un usuario con ese email")

    # ─────────────────────────────
    # 2. Persistir en Postgres (users)
    # ─────────────────────────────
    try:
        cur.execute("""
            INSERT INTO users (
                id, email, full_name, phone,
                business_name, cuit, condicion_fiscal,
                direccion, direccion_entrega, direccion_transporte,
                ciudad, provincia,
                telefono_oficina, telefono_adicional,
                mail_adicional,
                role, is_active,
                cognito_sub
            )
            VALUES (
                %s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,
                %s,%s,
                %s,%s,
                %s,
                %s,%s,
                %s
            )
        """, [
            cognito_sub,
            email,
            full_name,
            phone,

            business_name,
            cuit,
            condicion_fiscal,

            direccion,
            delivery_address,
            direccion_transporte,

            ciudad,
            provincia,

            telefono_oficina,
            telefono_adicional,

            mail_adicional,

            role,
            True,
            cognito_sub
        ])

        # ─────────────────────────────
        # 3. Vincular empresas elegidas por el admin
        # ─────────────────────────────
        for company_id in companies:
            cur.execute("""
                INSERT INTO user_companies (user_id, company_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, [cognito_sub, company_id])

        # ─────────────────────────────
        # 4. Marcar la solicitud como aprobada
        # ─────────────────────────────
        cur.execute("""
            UPDATE account_requests
            SET status = 'approved'
            WHERE id = %s
        """, [request_id])

        conn.commit()

    except Exception as e:
        conn.rollback()

        # rollback cognito si falla la DB
        try:
            cognito.admin_delete_user(
                UserPoolId=USER_POOL_ID,
                Username=email
            )
        except:
            pass

        cur.close()
        conn.close()
        print("APPROVE ACCOUNT REQUEST ERROR")
        print(str(e))
        return server_error()

    cur.close()
    conn.close()

    return success({
        "id": cognito_sub,
        "email": email,
        "full_name": full_name,
        "message": "Usuario creado y solicitud aprobada"
    })

def reject_account_request(request_id):
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Actualizamos el estado a 'rejected' usando cast nativo a UUID
        cur.execute("""
            UPDATE account_requests
            SET status = 'rejected'
            WHERE id = %s::uuid
        """, [request_id])

        conn.commit()

        # Usamos tu helper "success" que ya inyecta los headers correctos
        return success({"message": "Solicitud rechazada con éxito", "id": request_id})

    except Exception as e:
        print("❌ ERROR AL RECHAZAR SOLICITUD EN BD:", str(e))
        conn.rollback()
        return server_error()

    finally:
        cur.close()
        conn.close()

def handler(event, context):

    print(f"DEBUG: Evento completo recibido: {json.dumps(event)}")
    
    method = event["requestContext"]["http"]["method"]
    path = event["requestContext"]["http"]["path"]

    print("METHOD:", method)
    print("PATH:", path)

    user, error = require_admin(event)

    if error:
        return error

    try:

        body = json.loads(event.get("body") or "{}")
        print(f"DEBUG: El cuerpo (body) que la Lambda procesará es: {body}")
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
        # ACCOUNT REQUESTS
        # ==========================
        
        if path.startswith("/admin/account-requests"):

            # 1. Listar todas las solicitudes (GET /admin/account-requests)
            if method == "GET" and path == "/admin/account-requests":
                return list_account_requests()
            
            # 2. Rechazar una solicitud específica (POST /admin/account-requests/{id}/reject)
            if method == "POST" and path.endswith("/reject"):
                req_id = resource_id or path.split("/")[-2]
                return reject_account_request(req_id)
            
            if method == "POST" and path.endswith("/accept"):
                req_id = resource_id or path.split("/")[-2]
                return approve_account_request(req_id, body)
    

        # ==========================
        # COMPANIES
        # ==========================
        
        if path.startswith("/admin/companies"):
        
            if method == "GET":
        
                if resource_id:
                    return get_company(resource_id)
        
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
                if resource_id:
                    return get_product(resource_id)
                return list_products(params)

            if method == "POST":
                return create_product(body)

            if method == "PATCH" and resource_id:
                return update_product(resource_id, body)

            if method == "DELETE" and resource_id:
                return delete_product(resource_id)
        
        # ==========================
        # ORDERS
        # ==========================
        
        if path.startswith("/admin/companies"):

            if method == "GET":
                if resource_id:
                    return get_company(resource_id)
                return list_companies()
        
            if method == "POST":
                return create_company(body)
        
            if method == "PATCH" and resource_id:
                return update_company(resource_id, body)
        
            if method == "DELETE" and resource_id:
                return delete_company(resource_id)

    except Exception as e:
        print(str(e))
        return server_error()