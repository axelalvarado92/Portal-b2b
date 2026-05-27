# lambdas/admin_import_products/lambda_function.py

import sys
import os
import json
import base64
import zipfile

from io import BytesIO
from decimal import Decimal

import openpyxl
import xlrd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.db import get_connection

from shared.auth_utils import require_auth

from shared.utils import (
    success,
    bad_request,
    unauthorized,
    server_error
)

# =========================================================
# COLUMN MAPPINGS
# =========================================================

COLUMN_ALIASES = {

    # CODE
    "CODIGO": "code",
    "CÓDIGO": "code",
    "COD": "code",
    "ID_PRODUCTO": "code",
    "ID PRODUCTO": "code",

    # NAME
    "DESCRIPCION": "name",
    "DESCRIPCIÓN": "name",
    "PRODUCTO": "name",

    # PRICE
    "PRECIO": "price",
    "PRECIO UNITARIO": "price",

    # UNIT
    "UNIDAD MED.": "unit_type",
    "UNIDAD": "unit_type",

    # STOCK
    "STOCK": "stock_quantity"
}

# =========================================================
# HEADER PATTERNS
# =========================================================

HEADER_PATTERNS = [

    ["CODIGO", "DESCRIPCION"],
    ["CODIGO", "PRECIO"],
    ["CODIGO", "PRECIO UNITARIO"],
    ["ID_PRODUCTO", "PRECIO"],
    ["ID PRODUCTO", "PRECIO"]
]

# =========================================================
# HELPERS
# =========================================================

def normalize_text(value):

    if value is None:
        return ""

    return str(value).strip()


def normalize_header(value):

    if not value:
        return None

    cleaned = str(value).strip().upper()

    return COLUMN_ALIASES.get(cleaned)


def parse_price(value):

    if value is None:
        return Decimal("0")

    # Excel parseado automáticamente
    if isinstance(value, (int, float)):

        return Decimal(
            str(round(float(value), 4))
        )

    text = str(value).strip()

    text = text.replace("$", "")

    # formato 1.234,56
    if "," in text and "." in text:

        text = text.replace(".", "")
        text = text.replace(",", ".")

    # formato 1234,56
    elif "," in text:

        text = text.replace(",", ".")

    try:

        return Decimal(text)

    except:

        return Decimal("0")


def is_empty_row(row):

    return not any(
        v is not None and str(v).strip()
        for v in row
    )


# =========================================================
# HANDLER
# =========================================================

def handler(event, context):

    conn = None
    cur = None

    try:

        IS_XLS = False

        method = event["requestContext"]["http"]["method"]

        # =====================================================
        # ONLY POST
        # =====================================================

        if method != "POST":
            return bad_request("Método no permitido")

        # =====================================================
        # AUTH
        # =====================================================

        user, error = require_auth(event)

        if error:
            return error

        if user["role"] != "admin":
            return unauthorized()

        # =====================================================
        # BODY
        # =====================================================

        body = json.loads(event.get("body") or "{}")

        company_id = body.get("company_id")
        file_base64 = body.get("file_base64")
        filename = body.get("filename")

        # =====================================================
        # VALIDATIONS
        # =====================================================

        if not company_id:
            return bad_request("company_id es requerido")

        if not file_base64:
            return bad_request("file_base64 es requerido")

        if not filename:
            return bad_request("filename es requerido")

        # =====================================================
        # DECODE BASE64
        # =====================================================

        try:

            file_bytes = base64.b64decode(file_base64)

        except Exception:

            return bad_request(
                "Archivo base64 inválido"
            )

        print(f"Filename recibido: {filename}")
        print(f"Tamaño archivo: {len(file_bytes)} bytes")
        print(f"Primeros bytes: {file_bytes[:20]}")

        # =====================================================
        # DETECT EXCEL FORMAT
        # =====================================================

        try:

            is_xlsx_real = zipfile.is_zipfile(
                BytesIO(file_bytes)
            )

            # =================================================
            # XLSX
            # =================================================

            if is_xlsx_real:

                print("Archivo detectado como XLSX")

                IS_XLS = False

                workbook = openpyxl.load_workbook(
                    BytesIO(file_bytes),
                    data_only=True
                )

                sheets = workbook.worksheets

            # =================================================
            # XLS
            # =================================================

            else:

                print("Archivo detectado como XLS")

                IS_XLS = True

                xls_book = xlrd.open_workbook(
                    file_contents=file_bytes
                )

                sheets = []

                for sheet_name in xls_book.sheet_names():

                    sheets.append(
                        xls_book.sheet_by_name(sheet_name)
                    )

        except Exception as e:

            print(f"Error abriendo Excel: {str(e)}")

            return bad_request(
                "No se pudo leer el archivo Excel"
            )

        # =====================================================
        # DB CONNECTION
        # =====================================================

        conn = get_connection()
        cur = conn.cursor()

        # =====================================================
        # RESPONSE DATA
        # =====================================================

        all_preview = []

        total_rows = 0

        processed_sheets = []

        # =====================================================
        # PROCESS SHEETS
        # =====================================================

        for sheet in sheets:

            # =================================================
            # XLSX
            # =================================================

            if not IS_XLS:

                sheet_name = sheet.title

                rows = list(
                    sheet.iter_rows(values_only=True)
                )

            # =================================================
            # XLS
            # =================================================

            else:

                sheet_name = sheet.name

                rows = []

                for row_idx in range(sheet.nrows):

                    rows.append(
                        sheet.row_values(row_idx)
                    )

            print(f"Procesando hoja: {sheet_name}")

            # =================================================
            # FIND HEADER ROW
            # =================================================

            header_row_index = None

            for idx, row in enumerate(rows):

                values = [
                    str(v).strip().upper()
                    for v in row
                    if v is not None and str(v).strip()
                ]

                print(f"Fila {idx}: {values}")

                for pattern in HEADER_PATTERNS:

                    matches = 0

                    for item in pattern:

                        if item in values:
                            matches += 1

                    if matches >= 2:

                        header_row_index = idx

                        print(
                            f"Header detectado en fila {idx}"
                        )

                        break

                if header_row_index is not None:
                    break

            # =================================================
            # NO HEADER
            # =================================================

            if header_row_index is None:

                print(
                    f"No se encontró header en hoja {sheet_name}"
                )

                continue

            processed_sheets.append(sheet_name)

            # =================================================
            # HEADERS
            # =================================================

            header_row = rows[header_row_index]

            headers = [
                normalize_header(cell)
                for cell in header_row
            ]

            print(f"Headers detectados: {headers}")

            # =================================================
            # REQUIRED COLUMNS
            # =================================================

            required_columns = [
                "code",
                "price"
            ]

            missing_columns = []

            for column in required_columns:

                if column not in headers:
                    missing_columns.append(column)

            if missing_columns:

                return bad_request(
                    "Faltan columnas requeridas: "
                    + ", ".join(missing_columns)
                )

            # =================================================
            # CATEGORY CONTEXT
            # =================================================

            current_category = "GENERAL"

            # =================================================
            # READ ROWS
            # =================================================

            for row in rows[header_row_index + 1:]:

                # =============================================
                # IGNORE EMPTY ROWS
                # =============================================

                if is_empty_row(row):
                    continue

                # =============================================
                # DETECT CATEGORY ROW
                # =============================================

                non_empty = [
                    v for v in row
                    if v is not None and str(v).strip()
                ]

                if len(non_empty) == 1:

                    possible_category = str(
                        non_empty[0]
                    ).strip()

                    if len(possible_category) > 3:

                        current_category = possible_category

                        print(
                            f"Categoría detectada: "
                            f"{current_category}"
                        )

                        continue

                # =============================================
                # BUILD ROW DATA
                # =============================================

                row_data = {}

                for index, value in enumerate(row):

                    if index >= len(headers):
                        continue

                    field_name = headers[index]

                    if not field_name:
                        continue

                    row_data[field_name] = value

                # =============================================
                # VALIDATE REQUIRED DATA
                # =============================================

                code = normalize_text(
                    row_data.get("code")
                )

                if not code:
                    continue

                price = parse_price(
                    row_data.get("price")
                )

                if price <= 0:
                    continue

                name = normalize_text(
                    row_data.get("name")
                )

                if not name:
                    name = code

                # =============================================
                # OPTIONAL FIELDS
                # =============================================

                stock_quantity = (
                    row_data.get("stock_quantity")
                    or 0
                )

                unit_type = normalize_text(
                    row_data.get("unit_type")
                )

                if not unit_type:
                    unit_type = "unit"

                # =============================================
                # UPSERT
                # =============================================

                cur.execute("""
                    INSERT INTO products (
                        id,
                        company_id,
                        code,
                        name,
                        category,
                        price,
                        stock_quantity,
                        unit_type,
                        has_stock,
                        is_active
                    )
                    VALUES (
                        gen_random_uuid(),
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        true,
                        true
                    )
                    ON CONFLICT (company_id, code)
                    DO UPDATE SET
                        name = EXCLUDED.name,
                        category = EXCLUDED.category,
                        price = EXCLUDED.price,
                        stock_quantity = EXCLUDED.stock_quantity,
                        unit_type = EXCLUDED.unit_type,
                        updated_at = NOW()
                """, [
                    company_id,
                    code,
                    name,
                    current_category,
                    price,
                    stock_quantity,
                    unit_type
                ])

                total_rows += 1

                # =============================================
                # PREVIEW
                # =============================================

                if len(all_preview) < 10:

                    all_preview.append({

                        "sheet": sheet_name,
                        "category": current_category,
                        "code": code,
                        "name": name,
                        "price": str(price),
                        "stock_quantity": stock_quantity,
                        "unit_type": unit_type
                    })

        # =====================================================
        # VALID SHEETS
        # =====================================================

        if not processed_sheets:

            return bad_request(
                "No se encontraron hojas válidas"
            )

        # =====================================================
        # COMMIT
        # =====================================================

        conn.commit()

        # =====================================================
        # RESPONSE
        # =====================================================

        return success({

            "filename": filename,
            "processed_sheets": processed_sheets,
            "rows_detected": total_rows,
            "preview": all_preview
        })

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            f"Error en lambda_admin_import_products: "
            f"{str(e)}"
        )

        return server_error()

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()