import json
import boto3
import pandas as pd
import psycopg2
import uuid
import os
import re

from io import BytesIO

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

BUCKET_NAME = os.environ.get(
    "IMPORTS_BUCKET",
    "portal-b2b-imports-dev-47148"
)

s3 = boto3.client("s3")

# ---------------------------------------------------
# DB
# ---------------------------------------------------

def get_connection():

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
        # Si ya es número de pandas, devolverlo directo
        if isinstance(value, (int, float)):
            if math.isnan(value) or math.isinf(value):
                return None
            return float(value)
        
        # Limpiar string
        value = str(value).strip()
        value = value.replace("$", "").replace(" ", "").strip()
        
        if value == "":
            return None
        
        # Formato argentino: 1.234,56 → punto es miles, coma es decimal
        # Formato inglés: 1,234.56 → coma es miles, punto es decimal
        if "," in value and "." in value:
            if value.rfind(",") > value.rfind("."):
                # La coma está más a la derecha → argentino
                value = value.replace(".", "").replace(",", ".")
            else:
                # Inglés
                value = value.replace(",", "")
        elif "," in value:
            # Solo coma → decimal argentino: 1234,56
            value = value.replace(",", ".")
        # Si solo tiene punto (1234.56) → lo dejamos, float lo entiende
        
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
            1
            for cell in row_values
            if any(k in cell for k in keywords)
        )

        if matches >= 2:
            return index

    return None  # ← antes devolvía 0, ahora None si no encuentra header real

# ---------------------------------------------------
# NORMALIZAR COLUMNAS
# ---------------------------------------------------

def normalize_columns(columns):

    normalized = []

    for col in columns:

        col = normalize_text(col)

        if any(x in col for x in ["codigo", "cod", "sku"]):
            normalized.append("code")

        elif any(x in col for x in [
            "detalle",
            "descripcion",
            "producto",
            "nombre"
        ]):
            normalized.append("name")

        elif any(x in col for x in [
            "precio",
            "lista",
            "costo"
        ]):
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

        # CODE

        if idx == 0:

            numeric_ratio = sum(
                1
                for x in sample
                if str(x).replace(".", "").isdigit()
            )

            if numeric_ratio >= 5:
                mapping[col] = "code"
                continue

        # NAME

        text_ratio = sum(
            1
            for x in sample
            if isinstance(x, str) and len(x) > 5
        )

        if text_ratio >= 5:
            mapping[col] = "name"
            continue

        # PRICE

        price_ratio = sum(
            1
            for x in sample
            if isinstance(x, (int, float))
        )

        if price_ratio >= 5:
            mapping[col] = "price"
            continue

    return mapping

# ---------------------------------------------------
# UPSERT PRODUCT
# ---------------------------------------------------

def upsert_product(
    cur,
    company_id,
    code,
    name,
    price
):

    cur.execute("""

        INSERT INTO products (
            id,
            company_id,
            code,
            name,
            description,
            price,
            is_active,
            created_at,
            updated_at
        )

        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            true,
            NOW(),
            NOW()
        )

        ON CONFLICT (company_id, code)

        DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            updated_at = NOW()

    """, [
        str(uuid.uuid4()),
        company_id,
        code,
        name,
        name,
        price
    ])

    print("ROWCOUNT:", cur.rowcount)

# ---------------------------------------------------
# HANDLER
# ---------------------------------------------------

def handler(event, context):

    conn = None
    cur = None

    try:

        # ---------------------------------------------------
        # EVENT
        # ---------------------------------------------------

        company_id = event.get("company_id")
        s3_key = event.get("s3_key")

        if not company_id:

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Company no encontrado"
                })
            }

        if not s3_key:

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Falta s3_key"
                })
            }

        print(f"Company ID: {company_id}")
        print(f"S3 Key: {s3_key}")

        # ---------------------------------------------------
        # DOWNLOAD S3
        # ---------------------------------------------------

        response = s3.get_object(
            Bucket=BUCKET_NAME,
            Key=s3_key
        )

        file_bytes = response["Body"].read()

        print("INICIO LECTURA EXCEL")  # ← agregar acá

        # ---------------------------------------------------
        # READ EXCEL
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

            print("EXCEL LEIDO OK, engine:", engine_used)

        header_row = detect_header_row(df_preview)

        print("HEADER ROW DETECTADO:", header_row)

        if header_row is None:

            # No se detectó ningún header de texto: el archivo arranca
            # directo con datos. Leemos sin header y mapeamos por posición.

            df = pd.read_excel(
                BytesIO(file_bytes),
                header=None,
                engine=engine_used
            )

            print("SIN HEADER DETECTADO - usando mapeo posicional")
            print("DF COLUMNAS ORIGINALES:", df.columns.tolist())

            # Mapeo posicional fijo: primera columna = code,
            # última columna numérica = price, columna de texto más larga = name
            mapping = {}
            mapping[df.columns[0]] = "code"

            # Buscamos la columna con más texto largo para "name"
            text_col = None
            best_text_score = -1
            for col in df.columns[1:]:
                sample = df[col].dropna().head(10).tolist()
                score = sum(1 for x in sample if isinstance(x, str) and len(x) > 5)
                if score > best_text_score:
                    best_text_score = score
                    text_col = col

            if text_col is not None:
                mapping[text_col] = "name"

            # Buscamos la última columna numérica para "price"
            price_col = None
            for col in df.columns:
                sample = df[col].dropna().head(10).tolist()
                if sample and all(isinstance(x, (int, float)) for x in sample):
                    price_col = col

            if price_col is not None:
                mapping[price_col] = "price"

            df = df.rename(columns=mapping)

        else:

            df = pd.read_excel(
                BytesIO(file_bytes),
                header=header_row,
                engine=engine_used
            )

            print("DF COLUMNAS ORIGINALES:", df.columns.tolist())

            df.columns = normalize_columns(df.columns)

            if "code" not in df.columns:

                auto_mapping = auto_map_columns(df)

                df = df.rename(
                    columns=auto_mapping
                )

        required_columns = [
            "code",
            "name",
            "price"
        ]

        missing = [
            col
            for col in required_columns
            if col not in df.columns
        ]

        if missing:

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Columnas faltantes",
                    "missing": missing
                })
            }

        # ---------------------------------------------------
        # CLEAN DATAFRAME
        # ---------------------------------------------------

        df = df.dropna(how="all")

        df = df[[
            "code",
            "name",
            "price"
        ]]

        df["code"] = df["code"].apply(clean_string)
        df["name"] = df["name"].apply(clean_string)
        df["price"] = df["price"].apply(clean_price)
        print("===== PREVIEW DATAFRAME =====")
        print(df.head(20).to_dict("records"))
        print("=============================")

        df = df[
            df["code"].notna()
            & df["name"].notna()
        ]

        # ---------------------------------------------------
        # DB
        # ---------------------------------------------------

        conn = get_connection()
        cur = conn.cursor()

        processed = 0
        skipped = 0

        print(f"TOTAL FILAS: {len(df)}")

        # ---------------------------------------------------
        # LOOP
        # ---------------------------------------------------

        for index, row in df.iterrows():

            try:

                code = str(row["code"]).strip()

                if not code or code == "nan":

                    skipped += 1
                    continue

                print(f"PROCESANDO CODIGO: {code}")

                print(
                    f"INSERTANDO -> code={code}, "
                    f"name={row['name']}, "
                    f"price={row['price']}, "
                    f"tipo={type(row['price'])}"
                )

                upsert_product(
                    cur,
                    company_id,
                    code,
                    row["name"],
                    row["price"]
                )

                processed += 1

                # COMMIT POR BATCH

                if processed % 500 == 0:

                    print(f"COMMIT BATCH: {processed}")

                    conn.commit()

                # LOG

                if processed % 100 == 0:

                    print(f"Procesados: {processed}")

            except Exception as row_error:

                skipped += 1

                print("ERROR FILA:")
                print(str(row_error))

        # ---------------------------------------------------
        # FINAL COMMIT
        # ---------------------------------------------------

        conn.commit()

        print("IMPORT FINALIZADO")
        # ---------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Importacion completada",
                "engine_used": engine_used,
                "header_row": header_row if header_row is not None else "sin_header",
                "total_rows": len(df),
                "processed": processed,
                "skipped": skipped,
                "company_id": company_id
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

    finally:

        try:

            if cur:
                cur.close()

            if conn:
                conn.close()

        except Exception:

            pass