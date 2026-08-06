import json
import boto3
import pandas as pd
import psycopg2
import uuid
import os
import math
from itertools import product
from io import BytesIO
import logging
from datetime import datetime, timezone
from psycopg2.extras import RealDictCursor

# ─────────────────────────────────────────────────────────────
# Configuración
# ─────────────────────────────────────────────────────────────

logger = logging.getLogger()
logger.setLevel(logging.INFO)

S3_BUCKET = os.environ.get("S3_BUCKET")
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")

REQUIRED_PRODUCT_COLS = [
    "Código",
    "Nombre",
    "Descripción",
    "Categoría",
    "Precio Base",
    "Activo",
]

REQUIRED_VARIANT_COLS = [
    "Código Producto",
    "Grupo",
    "Valor",
    "Precio",
    "SKU",
    "Activo",
]

# ─────────────────────────────────────────────────────────────
# S3
# ─────────────────────────────────────────────────────────────

def download_excel_from_s3(key: str) -> BytesIO:
    s3 = boto3.client("s3")
    response = s3.get_object(Bucket=S3_BUCKET, Key=key)
    return BytesIO(response["Body"].read())


# ─────────────────────────────────────────────────────────────
# Excel
# ─────────────────────────────────────────────────────────────

def load_excel(buffer: BytesIO) -> tuple[pd.DataFrame, pd.DataFrame]:
    xls = pd.ExcelFile(buffer, engine="openpyxl")

    if "Productos" not in xls.sheet_names or "Variantes" not in xls.sheet_names:
        raise ValueError("El Excel debe contener las hojas 'Productos' y 'Variantes'")

    df_products = pd.read_excel(xls, sheet_name="Productos", dtype=str)
    df_variants = pd.read_excel(xls, sheet_name="Variantes", dtype=str)

    # Normalizar nombres de columnas (strip + título exacto)
    df_products.columns = [c.strip() for c in df_products.columns]
    df_variants.columns = [c.strip() for c in df_variants.columns]

    missing_products = [c for c in REQUIRED_PRODUCT_COLS if c not in df_products.columns]
    missing_variants = [c for c in REQUIRED_VARIANT_COLS if c not in df_variants.columns]

    if missing_products:
        raise ValueError(f"Faltan columnas en hoja Productos: {missing_products}")
    if missing_variants:
        raise ValueError(f"Faltan columnas en hoja Variantes: {missing_variants}")

    return df_products, df_variants


# ─────────────────────────────────────────────────────────────
# Variantes → JSON
# ─────────────────────────────────────────────────────────────

def build_variant_json(df_variants: pd.DataFrame, product_code: str) -> dict:
    """
    Construye el JSON de variantes que se almacenará
    en products.attributes.
    """

    rows = df_variants[
        df_variants["Código Producto"].astype(str).str.strip()
        == str(product_code).strip()
    ]

    if rows.empty:
        return {
            "variant_groups": []
        }

    groups = {}

    for _, row in rows.iterrows():

        if not _is_active(row.get("Activo")):
            continue

        group_name = str(row["Grupo"]).strip()

        option = {
            "value": str(row["Valor"]).strip()
        }
        
        sku = str(row.get("SKU", "")).strip()
        
        if sku:
            option["sku"] = sku

        groups.setdefault(group_name, []).append(option)

    variant_groups = []

    for group_name in sorted(groups.keys()):

        options = sorted(
            groups[group_name],
            key=lambda x: x["value"]
        )

        variant_groups.append({
            "name": group_name,
            "type": "single",
            "options": options
        })

    return {
        "variant_groups": variant_groups
    }


# ─────────────────────────────────────────────────────────────
# Base de datos
# ─────────────────────────────────────────────────────────────

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10,
    )


def get_category_id(cursor, company_id, category_name):

    category_name = category_name.strip()

    if not category_name:
        raise ValueError("La categoría es obligatoria.")

    cursor.execute(
        """
        SELECT id
        FROM categories
        WHERE company_id = %s
        AND lower(name)=lower(%s)
        """,
        (
            company_id,
            category_name
        )
    )

    row = cursor.fetchone()

    if row:
        return row[0]

    raise ValueError(
        f"La categoría '{category_name}' no existe."
    )


def upsert_product(
    cursor,
    company_id,
    code,
    name,
    description,
    category_id,
    is_active
):

    cursor.execute(
        """
        INSERT INTO products (
            company_id,
            code,
            name,
            description,
            category_id,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            %s,%s,%s,
            %s,%s,%s,
            NOW(),NOW()
        )
    
        ON CONFLICT (company_id, code)
    
        DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            attributes = EXCLUDED.attributes,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
    
        RETURNING
            id,
            (xmax = 0) AS inserted
        """,
        (
            company_id,
            code,
            name,
            description,
            category_id,
            is_active
        )
    )
    
    row = cursor.fetchone()

    return {
        "product_id": row[0],
        "inserted": row[1]
    }

def upsert_variant(
    cursor,
    product_id,
    sku,
    price,
    stock,
    attributes,
    is_active
):
    cursor.execute(
        """
        INSERT INTO product_variants (
            product_id,
            sku,
            price,
            stock,
            attributes,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            %s,%s,%s,%s,%s,%s,
            NOW(),NOW()
        )

        ON CONFLICT (sku)

        DO UPDATE SET
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            attributes = EXCLUDED.attributes,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        """,
        (
            product_id,
            sku,
            price,
            stock,
            json.dumps(attributes, ensure_ascii=False),
            is_active
        )
    )

def replace_variants(
    cursor,
    product_id,
    product_code,
    base_price,
    df_variants
):
    """
    Elimina todas las variantes del producto
    y vuelve a crearlas desde el Excel.
    """

    cursor.execute(
        "DELETE FROM product_variants WHERE product_id=%s",
        (product_id,)
    )

    rows = df_variants[
        df_variants["Código Producto"]
        .astype(str)
        .str.strip()
        == product_code
    ]

    if rows.empty:

        cursor.execute("""
            INSERT INTO product_variants
            (
                product_id,
                sku,
                price,
                stock,
                attributes,
                is_active
            )
            VALUES
            (%s,%s,%s,%s,%s,%s)
        """,(
            product_id,
            product_code,
            base_price,
            0,
            json.dumps({}),
            True
        ))

        return

    groups = {}

    for _, row in rows.iterrows():
    
        if not _is_active(row.get("Activo")):
            continue
    
        group = str(row["Grupo"]).strip()
    
        option = {
            "value": str(row["Valor"]).strip(),
            "price_extra": _to_float(row.get("Precio Extra"), 0),
            "sku": str(row.get("SKU", "")).strip()
        }
    
        groups.setdefault(group, []).append(option)

        sku = str(row.get("SKU", "")).strip()

        if not sku:
            sku = f"{product_code}-{uuid.uuid4().hex[:6].upper()}"

        price = _to_float(
            row.get("Precio"),
            base_price
        )

        attributes = {
            row["Grupo"]: row["Valor"]
        }

        cursor.execute("""
            INSERT INTO product_variants
            (
                product_id,
                sku,
                price,
                stock,
                attributes,
                is_active
            )
            VALUES
            (%s,%s,%s,%s,%s,%s)
        """,(
            product_id,
            sku,
            price,
            0,
            json.dumps(attributes),
            _is_active(row.get("Activo"))
        ))

def create_variants(
    cursor,
    product_id,
    product_code,
    base_price,
    df_variants
):
    rows = df_variants[
        df_variants["Código Producto"].astype(str).str.strip()
        == product_code
    ]

    if rows.empty:
        return

    for _, row in rows.iterrows():

        if not _is_active(row.get("Activo")):
            continue

        price_extra = _to_float(
            row.get("Precio Extra"),
            0
        )

        price = base_price + price_extra

        sku = str(
            row.get("SKU", "")
        ).strip()

        attributes = {
            str(row["Grupo"]).strip():
            str(row["Valor"]).strip()
        }

        cursor.execute("""
            INSERT INTO product_variants (
                product_id,
                sku,
                price,
                stock,
                attributes,
                is_active
            )
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            product_id,
            sku,
            price,
            0,
            json.dumps(attributes),
            True
        ))
        
# ─────────────────────────────────────────────────────────────
# Validaciones y utilidades
# ─────────────────────────────────────────────────────────────

def _to_float(value, default: float = 0.0) -> float:
    if pd.isna(value):
        return default
    try:
        return float(str(value).replace(",", ".").strip())
    except (ValueError, TypeError):
        return default


def _is_active(value) -> bool:
    if pd.isna(value):
        return True
    return str(value).strip().lower() not in ("no", "false", "0")


def is_valid_product(row) -> bool:
    code = str(row.get("Código", "")).strip()
    name = str(row.get("Nombre", "")).strip()
    price = _to_float(row.get("Precio Base"), None)

    return bool(code) and bool(name) and price is not None and price > 0


# ─────────────────────────────────────────────────────────────
# Procesamiento principal
# ─────────────────────────────────────────────────────────────

def process_import(company_id: str, s3_key: str) -> dict:
    buffer = download_excel_from_s3(s3_key)
    df_products, df_variants = load_excel(buffer)

    # ---------------------------------------------------
    # Validar que todas las variantes pertenezcan
    # a un producto existente
    # ---------------------------------------------------
    
    product_codes = set(
        df_products["Código"]
        .astype(str)
        .str.strip()
    )
    
    variant_codes = set(
        df_variants["Código Producto"]
        .astype(str)
        .str.strip()
    )
    
    invalid_codes = sorted(
        variant_codes - product_codes
    )
    
    if invalid_codes:
    
        raise ValueError(
            "Las siguientes variantes pertenecen a productos inexistentes:\n"
            + "\n".join(invalid_codes)
        )

    # ---------------------------------------------------
    # Validar códigos de producto duplicados
    # ---------------------------------------------------
    
    duplicate_codes = (
        df_products["Código"]
        .astype(str)
        .str.strip()
    )
    
    duplicate_codes = duplicate_codes[
        duplicate_codes.duplicated()
    ]
    
    if not duplicate_codes.empty:
    
        duplicates = sorted(
            duplicate_codes.unique().tolist()
        )
    
        raise ValueError(
            "Hay códigos de producto duplicados:\n"
            + "\n".join(duplicates)
        )

    # ---------------------------------------------------
    # Variantes duplicadas
    # ---------------------------------------------------
    
    duplicate_variants = (
        df_variants[
            ["Código Producto", "Grupo", "Valor"]
        ]
        .astype(str)
        .apply(lambda s: s.str.strip())
    )
    
    duplicates = duplicate_variants[
        duplicate_variants.duplicated()
    ]
    
    if not duplicates.empty:
    
        duplicated_rows = duplicates.values.tolist()
    
        raise ValueError(
            "Existen variantes duplicadas:\n"
            + "\n".join(
                f"{r[0]} | {r[1]} | {r[2]}"
                for r in duplicated_rows
            )
        )

    # ---------------------------------------------------
    # Grupo vacío
    # ---------------------------------------------------
    
    if (
        df_variants["Grupo"]
        .astype(str)
        .str.strip()
        .eq("")
        .any()
    ):
    
        raise ValueError(
            "Hay variantes sin Grupo."
        )

    # ---------------------------------------------------
    # Valor vacío
    # ---------------------------------------------------
    
    if (
        df_variants["Valor"]
        .astype(str)
        .str.strip()
        .eq("")
        .any()
    ):
    
        raise ValueError(
            "Hay variantes sin Valor."
        )

    # ---------------------------------------------------
    # Normalizar grupos
    # ---------------------------------------------------
    
    df_variants["Grupo"] = (
        df_variants["Grupo"]
        .astype(str)
        .str.strip()
        .str.title()
    )

    inserted = 0
    updated = 0
    discarded = 0

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        for _, row in df_products.iterrows():
            if not is_valid_product(row):
                discarded += 1
                continue

            code = str(row["Código"]).strip()
            name = str(row["Nombre"]).strip()
            description = str(row.get("Descripción", "")).strip()
            category_name = str(row.get("Categoría", "")).strip()
            base_price = _to_float(row.get("Precio Base"), 0)
            is_active = _is_active(row.get("Activo"))

            category_id = get_category_id(cursor, company_id, category_name)

            product_result = upsert_product(
                cursor=cursor,
                company_id=company_id,
                code=code,
                name=name,
                description=description,
                category_id=category_id,
                is_active=is_active,
            )
            
            product_id = product_result["product_id"]
            
            replace_variants(
                cursor=cursor,
                product_id=product_id,
                product_code=code,
                base_price=base_price,
                df_variants=df_variants,
            )
            
            if product_result["inserted"]:
                inserted += 1
            else:
                updated += 1

        conn.commit()

    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    return {
        "inserted": inserted,
        "updated": updated,
        "processed": inserted + updated,
        "discarded": discarded,
    }


# ─────────────────────────────────────────────────────────────
# Handler
# ─────────────────────────────────────────────────────────────

def lambda_handler(event, context):
    try:
        company_id = event.get("company_id")
        s3_key = event.get("s3_key")

        if not company_id or not s3_key:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Faltan company_id o s3_key"}),
            }

        result = process_import(company_id, s3_key)

        logger.info("Importación finalizada: %s", result)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Importación completada",
                **result,
            }),
        }

    except ValueError as e:
        logger.error("Error de validación: %s", e)
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)}),
        }

    except Exception as e:
        logger.exception("Error inesperado en la importación")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Error interno del servidor"}),
        }