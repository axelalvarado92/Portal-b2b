import json
import boto3
import pandas as pd
import psycopg2
import uuid
import os
import math

from io import BytesIO

BUCKET_NAME = os.environ.get("IMPORTS_BUCKET", "portal-b2b-imports-dev-47148")
s3 = boto3.client("s3")

def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def normalize_text(value):
    if value is None or pd.isna(value):
        return ""
    value = str(value).strip().lower()
    replacements = {"ó": "o", "í": "i", "á": "a", "é": "e", "ú": "u", "ñ": "n"}
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value

def clean_string(value):
    if value is None or pd.isna(value):
        return None
    value = str(value).strip()
    if value == "" or value.lower() == "nan":
        return None
    return value

def clean_price(value):
    if pd.isna(value):
        return None
    try:
        if isinstance(value, (int, float)):
            if math.isnan(value) or math.isinf(value):
                return None
            return float(value)
        value = str(value).strip().replace("$", "").replace(" ", "").strip()
        if value == "":
            return None
        if "," in value and "." in value:
            if value.rfind(",") > value.rfind("."):
                value = value.replace(".", "").replace(",", ".")
            else:
                value = value.replace(",", "")
        elif "," in value:
            value = value.replace(",", ".")
        return float(value)
    except Exception:
        return None

def safe_series_values(series, max_items=10):
    if series is None:
        return []
    if isinstance(series, pd.DataFrame):
        series = series.iloc[:, 0]
    if not isinstance(series, pd.Series):
        return []
    try:
        return list(series.dropna().head(max_items))
    except Exception:
        return []

def score_header_row(row_values):
    """Puntúa una fila candidata a header. Mayor = mejor."""
    score = 0
    non_empty = [v for v in row_values if v]
    
    # Si tiene menos de 2 celdas con contenido, no es header
    if len(non_empty) < 2:
        return 0
    
    for i, cell in enumerate(row_values):
        if not cell:
            continue
        cell_lower = str(cell).lower()
        
        # CODIGO en primera columna con contenido = MUY buen header
        if i == 0 and any(k in cell_lower for k in ["codigo", "cod.", "cod ", "nro", "numero"]):
            score += 10
        
        # CODIGO en cualquier columna
        if any(k in cell_lower for k in ["codigo", "cod.", "cod ", "nro", "numero", "sku", "id"]):
            score += 4
            
        # PRODUCTO/NOMBRE
        if any(k in cell_lower for k in ["producto", "descripcion", "detalle", "articulo", "nombre", "item"]):
            score += 3
            
        # PRECIO
        if any(k in cell_lower for k in ["precio", "lista", "costo", "valor", "importe"]):
            score += 2
    
    # Penalizar filas que parecen títulos (largas, sin estructura de tabla)
    if len(non_empty) == 1 and len(str(non_empty[0])) > 30:
        score -= 5
    
    return score

def detect_header_row(df_preview):
    best_score = -1
    best_row = None
    
    for index in range(min(25, len(df_preview))):
        try:
            row = df_preview.iloc[index]
            if not hasattr(row, 'tolist'):
                continue
            
            raw_values = row.tolist()
            # Ignorar celdas NaN al inicio para encontrar la primera con contenido
            row_values = []
            for v in raw_values:
                if pd.isna(v):
                    row_values.append("")
                else:
                    row_values.append(normalize_text(v))
            
            score = score_header_row(row_values)
            print(f"Fila {index}: score={score}, vals={[v[:30] if v else '' for v in row_values]}")
            
            if score > best_score:
                best_score = score
                best_row = index
                
        except Exception as e:
            print(f"Error fila {index}: {e}")
            continue
    
    # Necesitamos al menos 5 puntos de confianza (codigo + producto)
    if best_score >= 5:
        return best_row
    return None

def normalize_columns(columns):
    normalized = []
    for col in columns:
        if isinstance(col, tuple):
            col = " ".join(str(c) for c in col if pd.notna(c))
        col_str = normalize_text(col)
        
        # Ignorar columnas "unnamed"
        if col_str.startswith("unnamed"):
            normalized.append(col_str)
            continue
            
        if any(x in col_str for x in ["codigo", "cod", "sku", "nro", "numero", "articulo", "art.", "id"]):
            normalized.append("code")
        elif any(x in col_str for x in ["detalle", "descripcion", "producto", "nombre", "item", "articulo"]):
            normalized.append("name")
        elif any(x in col_str for x in ["precio", "lista", "costo", "valor", "importe", "unitario"]):
            normalized.append("price")
        else:
            normalized.append(col_str)
    return normalized

def deduplicate_columns(columns):
    """Agrega sufijo numérico a columnas duplicadas para evitar DataFrames."""
    seen = {}
    result = []
    for col in columns:
        if col in seen:
            seen[col] += 1
            result.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            result.append(col)
    return result

def auto_map_columns(df):
    mapping = {}
    n_cols = len(df.columns)
    
    for idx in range(n_cols):
        try:
            col = df.columns[idx]
            # Ignorar columnas unnamed
            if isinstance(col, str) and col.lower().startswith("unnamed"):
                continue
                
            sample = safe_series_values(df.iloc[:, idx], 10)
            if not sample:
                continue
            
            # CODE: primera columna no-vacía con códigos alfanuméricos
            if idx <= 1:
                code_count = sum(
                    1 for x in sample
                    if x is not None and (
                        str(x).replace(".", "").replace(",", "").strip().isdigit() or
                        (isinstance(x, str) and len(str(x)) <= 15 and any(c.isdigit() for c in str(x)))
                    )
                )
                if code_count >= 3:
                    mapping[col] = "code"
                    continue
            
            # NAME: texto descriptivo
            text_count = sum(1 for x in sample if isinstance(x, str) and len(x) > 3)
            if text_count >= 3:
                mapping[col] = "name"
                continue
            
            # PRICE: números
            price_count = sum(1 for x in sample if isinstance(x, (int, float)) and not pd.isna(x))
            if price_count >= 3:
                mapping[col] = "price"
                continue
                
        except Exception as e:
            print(f"Error mapeando idx {idx}: {e}")
            continue
    
    return mapping

def positional_mapping(df):
    """Mapeo por posición cuando no hay header detectado."""
    n_cols = len(df.columns)
    if n_cols < 3:
        return {}
    
    mapping = {}
    
    # Ignorar primera columna si es unnamed/vacía
    start_idx = 0
    first_col_name = str(df.columns[0]).lower()
    if first_col_name.startswith("unnamed") or first_col_name == "nan":
        start_idx = 1
    
    # Primera columna con datos = code
    if start_idx < n_cols:
        mapping[df.columns[start_idx]] = "code"
    
    # Buscar columna de texto para name
    best_text_col = None
    best_text_score = -1
    for idx in range(start_idx + 1, n_cols):
        try:
            sample = safe_series_values(df.iloc[:, idx], 10)
            score = sum(1 for x in sample if isinstance(x, str) and len(x) > 3)
            if score > best_text_score:
                best_text_score = score
                best_text_col = df.columns[idx]
        except:
            continue
    if best_text_col is not None:
        mapping[best_text_col] = "name"
    
    # Buscar columna numérica para price (última preferida)
    best_price_col = None
    best_price_score = -1
    for idx in range(start_idx, n_cols):
        if df.columns[idx] in mapping:
            continue
        try:
            sample = safe_series_values(df.iloc[:, idx], 10)
            score = sum(1 for x in sample if isinstance(x, (int, float)) and not pd.isna(x))
            if score > best_price_score:
                best_price_score = score
                best_price_col = df.columns[idx]
        except:
            continue
    if best_price_col is not None:
        mapping[best_price_col] = "price"
    
    return mapping

def is_valid_header(columns):
    """Verifica si un header mapeado tiene code y name."""
    normalized = normalize_columns(columns)
    has_code = "code" in normalized
    has_name = "name" in normalized
    # Si hay duplicados de price, es sospechoso
    price_count = normalized.count("price")
    return has_code and has_name and price_count <= 1

def upsert_product(cur, company_id, code, name, price):
    cur.execute("""
        INSERT INTO products (
            id, company_id, code, name, description,
            price, is_active, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, true, NOW(), NOW())
        ON CONFLICT (company_id, code)
        DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            updated_at = NOW()
    """, [
        str(uuid.uuid4()), company_id, code, name, name, price
    ])
    print("ROWCOUNT:", cur.rowcount)

def handler(event, context):
    conn = None
    cur = None
    
    try:
        company_id = event.get("company_id")
        s3_key = event.get("s3_key")
        
        if not company_id:
            return {"statusCode": 400, "body": json.dumps({"error": "Company no encontrado"})}
        if not s3_key:
            return {"statusCode": 400, "body": json.dumps({"error": "Falta s3_key"})}
        
        print(f"Company ID: {company_id}")
        print(f"S3 Key: {s3_key}")
        
        response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        file_bytes = response["Body"].read()
        print("INICIO LECTURA EXCEL")
        
        try:
            df_preview = pd.read_excel(BytesIO(file_bytes), header=None, engine="openpyxl")
            engine_used = "openpyxl"
        except Exception:
            df_preview = pd.read_excel(BytesIO(file_bytes), header=None, engine="xlrd")
            engine_used = "xlrd"
        
        print("EXCEL LEIDO OK, engine:", engine_used)
        print(f"Shape preview: {df_preview.shape}")
        
        header_row = detect_header_row(df_preview)
        print("HEADER ROW DETECTADO:", header_row)
        
        # Leer con el header detectado
        if header_row is not None:
            df = pd.read_excel(BytesIO(file_bytes), header=header_row, engine=engine_used)
            print("COLUMNAS ORIGINALES:", list(df.columns))
            
            # Verificar si el header es válido
            if not is_valid_header(df.columns):
                print("HEADER INVALIDO, usando mapeo posicional")
                df = pd.read_excel(BytesIO(file_bytes), header=None, engine=engine_used)
                mapping = positional_mapping(df)
                df = df.rename(columns=mapping)
            else:
                # Aplanar MultiIndex
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [" ".join(str(c) for c in col if pd.notna(c)).strip() for col in df.columns]
                
                # Normalizar
                df.columns = normalize_columns(df.columns)
                print("COLUMNAS NORMALIZADAS:", list(df.columns))
                
                # Deduplicar para evitar DataFrames
                df.columns = deduplicate_columns(list(df.columns))
                print("COLUMNAS DEDUPLICADAS:", list(df.columns))
                
                # Si faltan columnas, auto_map
                if "code" not in df.columns or "name" not in df.columns:
                    print("FALTAN COLUMNAS, intentando auto_map")
                    auto_mapping = auto_map_columns(df)
                    print("AUTO MAP:", auto_mapping)
                    df = df.rename(columns=auto_mapping)
        else:
            # Sin header detectado
            df = pd.read_excel(BytesIO(file_bytes), header=None, engine=engine_used)
            print("SIN HEADER - mapeo posicional")
            mapping = positional_mapping(df)
            df = df.rename(columns=mapping)
        
        print("COLUMNAS FINALES:", list(df.columns))
        
        # SOLO code y name son obligatorios
        if "code" not in df.columns or "name" not in df.columns:
            missing = [c for c in ["code", "name"] if c not in df.columns]
            print("COLUMNAS FALTANTES:", missing)
            return {"statusCode": 400, "body": json.dumps({"error": "Columnas faltantes", "missing": missing})}
        
        # Seleccionar columnas que existen
        cols_to_keep = ["code", "name"]
        if "price" in df.columns:
            cols_to_keep.append("price")
        
        df = df.dropna(how="all")
        df = df[cols_to_keep]
        
        df["code"] = df["code"].apply(clean_string)
        df["name"] = df["name"].apply(clean_string)
        if "price" in df.columns:
            df["price"] = df["price"].apply(clean_price)
        
        print("PREVIEW:", df.head(10).to_dict("records"))
        
        # Filtrar filas vacías
        mask = df["code"].notna() & df["name"].notna()
        df = df[mask]
        
        conn = get_connection()
        cur = conn.cursor()
        
        processed = 0
        skipped = 0
        print(f"TOTAL A PROCESAR: {len(df)}")
        
        for index in range(len(df)):
            try:
                row = df.iloc[index]
                code = str(row["code"]).strip()
                if not code or code.lower() == "nan":
                    skipped += 1
                    continue
                
                # Saltear filas que parecen categorías
                if len(code) > 20 and not any(c.isdigit() for c in code):
                    print(f"SALTEANDO CATEGORIA: {code}")
                    skipped += 1
                    continue
                
                # Precio: convertir np.float64 a float nativo
                price = None
                if "price" in df.columns:
                    price = row.get("price", None)
                    if pd.isna(price):
                        price = None
                    elif price is not None:
                        price = float(price)  # ← FIX: np.float64 → float
                
                print(f"PROCESANDO: code={code}, name={row['name']}, price={price}, tipo={type(price)}")
                upsert_product(cur, company_id, code, row["name"], price)
                processed += 1
                
                if processed % 500 == 0:
                    conn.commit()
                    print(f"COMMIT BATCH: {processed}")
                    
            except Exception as row_error:
                try:
                    conn.rollback()
                except Exception as rollback_err:
                    print(f"Rollback error: {rollback_err}")
                
                skipped += 1
                print(f"ERROR FILA {index}: {str(row_error)}")
                print(f"  code={row.get('code', 'N/A')}, name={row.get('name', 'N/A')}, price={row.get('price', 'N/A')}")
        
        conn.commit()
        print("IMPORT FINALIZADO")
        
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
        import traceback
        traceback.print_exc()
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
        
    finally:
        try:
            if cur: cur.close()
            if conn: conn.close()
        except Exception:
            pass