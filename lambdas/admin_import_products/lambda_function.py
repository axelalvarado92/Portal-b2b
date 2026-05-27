import json
import base64
import pandas as pd
import psycopg2
import uuid
import re

from io import BytesIO
from decimal import Decimal


# ---------------------------------------------------
# DB
# ---------------------------------------------------

def get_connection():

    import os

    return psycopg2.connect(
        os.environ["DATABASE_URL"]
    )


# ---------------------------------------------------
# NORMALIZAR TEXTO
# ---------------------------------------------------

def normalize_text(value):

    if value is None:
        return ""

    value = str(value).strip().lower()

    replacements = {
        "ó": "o",
        "í": "i",
        "á": "a",
        "é": "e",
        "ú": "u",
        "ñ": "n"
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    return value


# ---------------------------------------------------
# LIMPIAR STRING
# ---------------------------------------------------

def clean_string(value):

    if value is None:
        return None

    value = str(value).strip()

    if value == "":
        return None

    return value


# ---------------------------------------------------
# LIMPIAR PRECIO
# ---------------------------------------------------

def clean_price(value):

    if pd.isna(value):
        return None

    try:

        value = str(value)

        value = value.replace("$", "")
        value = value.replace(",", ".")
        value = value.strip()

        return float(value)

    except Exception:
        return None


# ---------------------------------------------------
# DETECTAR HEADER
# ---------------------------------------------------

def detect_header_row(df_preview):

    keywords = [
        "codigo",
        "cod",
        "sku",
        "detalle",
        "descripcion",
        "precio",
        "producto"
    ]

    for index, row in df_preview.iterrows():

        row_values = [
            normalize_text(v)
            for v in row.tolist()
        ]

        matches = sum(
            1 for cell in row_values
            if any(k in cell for k in keywords)
        )

        if matches >= 2:
            return index

    return 0


# ---------------------------------------------------
# NORMALIZAR COLUMNAS
# ---------------------------------------------------

def normalize_columns(columns):

    normalized = []

    for col in columns:

        col = normalize_text(col)

        if any(x in col for x in ["codigo", "cod", "sku"]):
            normalized.append("sku")

        elif any(x in col for x in ["detalle", "descripcion", "producto"]):
            normalized.append("description")

        elif any(x in col for x in ["precio", "lista", "costo"]):
            normalized.append("price")

        else:
            normalized.append(col)

    return normalized


# ---------------------------------------------------
# MAPEO AUTOMATICO
# ---------------------------------------------------

def auto_map_columns(df):

    columns = df.columns.tolist()

    mapping = {}

    for idx, col in enumerate(columns):

        sample = df[col].dropna().head(10).tolist()

        # -----------------------------------------
        # SKU
        # -----------------------------------------

        if idx == 0:

            numeric_ratio = sum(
                1 for x in sample
                if str(x).replace(".", "").isdigit()
            )

            if numeric_ratio >= 5:
                mapping[col] = "sku"
                continue

        # -----------------------------------------
        # DESCRIPTION
        # -----------------------------------------

        text_ratio = sum(
            1 for x in sample
            if isinstance(x, str) and len(x) > 5
        )

        if text_ratio >= 5:
            mapping[col] = "description"
            continue

        # -----------------------------------------
        # PRICE
        # -----------------------------------------

        price_ratio = sum(
            1 for x in sample
            if isinstance(x, (int, float))
        )

        if price_ratio >= 5:
            mapping[col] = "price"
            continue

    return mapping


# ---------------------------------------------------
# UPSERT PRODUCT
# ---------------------------------------------------

def upsert_product(cur, company_id, sku, description, price):

    cur.execute("""
        SELECT id
        FROM products
        WHERE company_id = %s
        AND sku = %s
        LIMIT 1
    """, [company_id, sku])

    existing = cur.fetchone()

    if existing:

        cur.execute("""
            UPDATE products
            SET
                description = %s,
                price = %s,
                updated_at = NOW()
            WHERE id = %s
        """, [
            description,
            price,
            existing[0]
        ])

        return "updated"

    else:

        cur.execute("""
            INSERT INTO products (
                id,
                company_id,
                sku,
                description,
                price,
                is_active,
                created_at
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                true,
                NOW()
            )
        """, [
            str(uuid.uuid4()),
            company_id,
            sku,
            description,
            price
        ])

        return "created"


# ---------------------------------------------------
# HANDLER
# ---------------------------------------------------

def handler(event, context):

    try:

        body = json.loads(event.get("body") or "{}")

        company_id = body["company_id"]
        file_name = body["filename"]
        file_base64 = body["file_base64"]

        # ---------------------------------------------------
        # LIMPIAR BASE64
        # ---------------------------------------------------

        if "," in file_base64:
            file_base64 = file_base64.split(",")[1]

        file_bytes = base64.b64decode(file_base64)

        print(f"Archivo recibido: {file_name}")

        # ---------------------------------------------------
        # LEER PREVIEW
        # ---------------------------------------------------

        try:

            df_preview = pd.read_excel(
                BytesIO(file_bytes),
                header=None,
                engine="openpyxl"
            )

            engine_used = "openpyxl"

        except Exception:

            df_preview = pd.read_excel(
                BytesIO(file_bytes),
                header=None,
                engine="xlrd"
            )

            engine_used = "xlrd"

        print(f"ENGINE USADO: {engine_used}")

        # ---------------------------------------------------
        # DETECTAR HEADER
        # ---------------------------------------------------

        header_row = detect_header_row(df_preview)

        print(f"HEADER DETECTADO EN FILA: {header_row}")

        # ---------------------------------------------------
        # LEER DEFINITIVO
        # ---------------------------------------------------

        df = pd.read_excel(
            BytesIO(file_bytes),
            header=header_row,
            engine=engine_used
        )

        # ---------------------------------------------------
        # NORMALIZAR COLUMNAS
        # ---------------------------------------------------

        normalized_columns = normalize_columns(df.columns)

        df.columns = normalized_columns

        # ---------------------------------------------------
        # AUTO MAP
        # ---------------------------------------------------

        if "sku" not in df.columns:

            print("NO SE DETECTARON HEADERS VALIDOS")
            print("INTENTANDO MAPEO AUTOMATICO")

            auto_mapping = auto_map_columns(df)

            print(auto_mapping)

            df = df.rename(columns=auto_mapping)

        print("COLUMNAS FINALES:")
        print(df.columns.tolist())

        # ---------------------------------------------------
        # VALIDACIONES
        # ---------------------------------------------------

        required_columns = [
            "sku",
            "description",
            "price"
        ]

        missing = [
            col for col in required_columns
            if col not in df.columns
        ]

        if missing:

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Columnas requeridas faltantes",
                    "missing": missing
                })
            }

        # ---------------------------------------------------
        # LIMPIAR DATAFRAME
        # ---------------------------------------------------

        df = df.dropna(how="all")

        # conservar solo columnas necesarias
        df = df[[
            "sku",
            "description",
            "price"
        ]]

        # limpiar datos
        df["sku"] = df["sku"].apply(clean_string)
        df["description"] = df["description"].apply(clean_string)
        df["price"] = df["price"].apply(clean_price)

        # eliminar filas inválidas
        df = df[
            df["sku"].notna() &
            df["description"].notna()
        ]

        # ---------------------------------------------------
        # IMPORTAR
        # ---------------------------------------------------

        conn = get_connection()
        cur = conn.cursor()

        created = 0
        updated = 0
        skipped = 0

        for _, row in df.iterrows():

            try:

                result = upsert_product(
                    cur,
                    company_id,
                    str(row["sku"]),
                    row["description"],
                    row["price"]
                )

                if result == "created":
                    created += 1
                else:
                    updated += 1

            except Exception as row_error:

                skipped += 1

                print("ERROR FILA:")
                print(str(row_error))

        conn.commit()

        cur.close()
        conn.close()

        # ---------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Importacion completada",
                "engine_used": engine_used,
                "header_row": int(header_row),
                "total_rows": len(df),
                "created": created,
                "updated": updated,
                "skipped": skipped
            })
        }

    except Exception as e:

        print("ERROR GENERAL:")
        print(str(e))

        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }