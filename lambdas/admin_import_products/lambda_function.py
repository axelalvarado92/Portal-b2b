import json
import boto3
import pandas as pd
import psycopg2
import uuid
import os
from io import BytesIO
import logging

# ─────────────────────────────────────────────────────────────
# Configuración
# ─────────────────────────────────────────────────────────────

logger = logging.getLogger()
logger.setLevel(logging.INFO)

IMPORTS_BUCKET = os.environ.get("IMPORTS_BUCKET")
DB_HOST        = os.environ.get("DB_HOST")
DB_PORT        = os.environ.get("DB_PORT")
DB_NAME        = os.environ.get("DB_NAME")
DB_USER        = os.environ.get("DB_USER")
DB_PASSWORD    = os.environ.get("DB_PASSWORD")

REQUIRED_PRODUCT_COLS = [
    "Código",
    "Nombre",
    "Descripción",
    "Categoría",
    "Precio Base",
]

REQUIRED_VARIANT_COLS = [
    "Código Producto",
    "SKU",
    "Precio",
    "Stock",
]

COLUMN_MAP_PRODUCTS = {
    "codigo": "Código",
    "nombre": "Nombre",
    "descripcion": "Descripción",
    "categoria": "Categoría",
    "precio base": "Precio Base",
    "activo": "Activo",
    "marca": "Marca",
}

COLUMN_MAP_VARIANTS = {
    "codigo del producto": "Código Producto",
    "sku": "SKU",
    "precio": "Precio",
    "stock": "Stock",
    "activo": "Activo",
    "color": "Color",
    "talle": "Talle",
    "peso": "Peso",
    "presentacion": "Presentación",
}

ATTRIBUTE_COLUMNS = [
        "Color",
        "Talle",
        "Peso",
        "Presentación",
    ]

# ─────────────────────────────────────────────────────────────
# S3
# ─────────────────────────────────────────────────────────────

def download_excel_from_s3(key: str) -> BytesIO:
    s3 = boto3.client("s3")
    response = s3.get_object(Bucket=IMPORTS_BUCKET, Key=key)
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
    df_products.columns = [
        COLUMN_MAP_PRODUCTS.get(c.strip().lower(), c.strip())
        for c in df_products.columns
    ]
    
    df_variants.columns = [
        COLUMN_MAP_VARIANTS.get(c.strip().lower(), c.strip())
        for c in df_variants.columns
    ]

    missing_products = [c for c in REQUIRED_PRODUCT_COLS if c not in df_products.columns]
    missing_variants = [c for c in REQUIRED_VARIANT_COLS if c not in df_variants.columns]

    if missing_products:
        raise ValueError(f"Faltan columnas en hoja Productos: {missing_products}")
    if missing_variants:
        raise ValueError(f"Faltan columnas en hoja Variantes: {missing_variants}")

    return df_products, df_variants


# ─────────────────────────────────────────────────────────────
# atributos
# ─────────────────────────────────────────────────────────────


def build_attributes_from_row(row):
    attributes = {}

    for column in ATTRIBUTE_COLUMNS:

        if column not in row:
            continue

        value = row[column]

        if pd.isna(value):
            continue

        value = str(value).strip()

        if value:
            attributes[column] = value

    return attributes


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
        return None

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
        """, (
            product_id,
            product_code,
            base_price,
            1,
            json.dumps({}),
            True
        ))

        return

    used_skus = set()

    for _, row in rows.iterrows():

        if not _is_active(row.get("Activo")):
            continue

        # ---------------------------------------------------
        # Atributos de la variante
        # ---------------------------------------------------

        attributes = build_attributes_from_row(row)

        # ---------------------------------------------------
        # SKU
        # ---------------------------------------------------

        raw_sku = row.get("SKU")

        sku = (
            str(raw_sku).strip()
            if pd.notna(raw_sku)
            else ""
        )

        # Si el Excel no trae SKU, lo generamos automáticamente
        if not sku:

            attribute_values = [
                str(value).strip()
                for value in attributes.values()
                if str(value).strip()
            ]

            if attribute_values:
                sku = (
                    f"{product_code}-"
                    + "-".join(attribute_values)
                )
            else:
                sku = product_code

        # ---------------------------------------------------
        # Validar SKU duplicado
        # ---------------------------------------------------

        if sku in used_skus:
            raise ValueError(
                f"SKU duplicado: {sku}"
            )

        used_skus.add(sku)

        # ---------------------------------------------------
        # Precio
        # ---------------------------------------------------

        price = _to_float(
            row.get("Precio"),
            None
        )

        if price is None:
            price = base_price

        # ---------------------------------------------------
        # Stock
        # ---------------------------------------------------

        raw_stock = row.get("Stock")

        if pd.isna(raw_stock) or str(raw_stock).strip() == "":
            stock = 1
        else:
            stock = _to_float(raw_stock, 0)

        # ---------------------------------------------------
        # Insertar variante
        # ---------------------------------------------------

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
        """, (
            product_id,
            sku,
            price,
            stock,
            json.dumps(
                attributes,
                ensure_ascii=False
            ),
            _is_active(row.get("Activo"))
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

    conn = get_db_connection()
    cursor = conn.cursor()

    inserted = 0
    updated = 0
    discarded = 0

    try:
        for _, row in df_products.iterrows():
            if not is_valid_product(row):
                discarded += 1
                continue

            code = str(row["Código"]).strip()
            name = str(row["Nombre"]).strip()
            description = str(row.get("Descripción", "")).strip()
            raw_category = row.get("Categoría")
            category_name = str(raw_category).strip() if pd.notna(raw_category) else ""
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

def handler(event, context):
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