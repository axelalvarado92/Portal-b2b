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
    if pd.isna(value) or value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            f = float(value)
            if math.isnan(f) or math.isinf(f):
                return None
            return f
        
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
        
        result = float(value)
        if math.isnan(result) or math.isinf(result):
            return None
        return result
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
    score = 0
    non_empty = [v for v in row_values if v]
    if len(non_empty) < 2:
        return 0
    
    for i, cell in enumerate(row_values):
        if not cell:
            continue
        cell_lower = str(cell).lower()
        
        if i == 0 and any(k in cell_lower for k in ["codigo", "cod.", "cod ", "nro", "numero"]):
            score += 10
        if any(k in cell_lower for k in ["codigo", "cod.", "cod ", "nro", "numero", "sku", "id"]):
            score += 4
        if any(k in cell_lower for k in ["producto", "descripcion", "detalle", "articulo", "nombre", "item", "mercaderia", "mercancia"]):
            score += 3
        if any(k in cell_lower for k in ["precio", "lista", "costo", "valor", "importe", "unitario", "pcio", "kg", "bulto"]):
            score += 2
    
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
            row_values = []
            for v in raw_values:
                if pd.isna(v):
                    row_values.append("")
                else:
                    row_values.append(normalize_text(v))
            
            score = score_header_row(row_values)
            print(f"  Fila {index}: score={score}, vals={[v[:30] if v else '' for v in row_values]}")
            
            if score > best_score:
                best_score = score
                best_row = index
                
        except Exception as e:
            continue
    
    if best_score >= 5:
        return best_row
    return None

def normalize_columns(columns):
    normalized = []
    for col in columns:
        if isinstance(col, tuple):
            col = " ".join(str(c) for c in col if pd.notna(c))
        col_str = normalize_text(col)
        
        if col_str.startswith("unnamed"):
            normalized.append(col_str)
            continue
            
        # ========== CAMPOS FIJOS DEL SISTEMA ==========
        
        # Código del producto
        if any(x in col_str for x in ["codigo", "cod", "sku", "nro", "numero", "articulo", "art.", "id"]):
            normalized.append("code")
        
        # Nombre / descripción
        elif any(x in col_str for x in ["nombre", "producto", "descripcion", "detalle", "articulo", "item", "mercaderia", "mercancia"]):
            normalized.append("name")
        
        # ========== PRECIOS ESPECÍFICOS (detectar ANTES que "precio" genérico) ==========
        
        # Precio por unidad (prioridad alta, detectar antes que "precio" genérico)
        elif any(x in col_str for x in ["precio unidad", "precio unitario", "pcio unidad", "pcio. unidad"]):
            normalized.append("price_per_unit")
        
        # Precio por kg
        elif any(x in col_str for x in ["precio_kg", "precio kg", "pcio_kg", "pcio kg", "precio x kg", "precio kilo", "pcio. x kg", "pcio. kg"]):
            normalized.append("price_per_kg")
        
        # Precio por bulto
        elif any(x in col_str for x in ["precio_bulto", "precio bulto", "pcio_bulto", "pcio bulto", "precio x bulto", "pcio. x bulto", "pcio. bulto"]):
            normalized.append("price_bulk")
        
        # Precio genérico (fallback si no es ninguno de los específicos)
        elif any(x in col_str for x in ["precio", "lista", "costo", "valor", "importe", "pcio"]):
            normalized.append("price")
        
        # ========== ATRIBUTOS DINÁMICOS ==========
        
        elif any(x in col_str for x in ["color", "colour"]):
            normalized.append("attr_color")
        elif any(x in col_str for x in ["talle", "talla", "size"]):
            normalized.append("attr_talle")
        elif any(x in col_str for x in ["tamano", "tamaño", "dimension", "medida", "largo", "ancho", "alto"]):
            normalized.append("attr_tamano")
        elif any(x in col_str for x in ["material", "composicion", "composición"]):
            normalized.append("attr_material")
        elif any(x in col_str for x in ["sabor", "savour", "flavor", "gusto"]):
            normalized.append("attr_sabor")
        elif any(x in col_str for x in ["peso", "peso neto", "peso bruto"]):
            normalized.append("attr_peso")
        elif any(x in col_str for x in ["cantidad", "cant x bulto", "cantidad x bulto", "unidades"]):
            normalized.append("attr_cantidad")
        
        # ========== CUALQUIER OTRA COLUMNA ==========
        # Se guarda como atributo dinámico para que no se pierda
        else:
            # Limpiar nombre para usar como key JSON
            attr_name = col_str.replace(" ", "_").replace("-", "_")[:30]
            normalized.append(f"attr_{attr_name}")
    
    return normalized

def is_valid_header(columns):
    normalized = normalize_columns(columns)
    has_code = "code" in normalized
    has_name = "name" in normalized
    price_count = normalized.count("price")
    return has_code and has_name and price_count <= 2

def detect_price_column(columns):
    """
    Detecta qué columna de precio usar.
    Prioridad: precio unitario > precio por kg > precio por bulto
    """
    normalized = [normalize_text(c) for c in columns]
    
    unit_keywords = ["precio unidad", "pcio. x kg", "precio por kg", "precio x kg", "pcio x kg", "precio kg", "precio unitario"]
    bulk_keywords = ["pcio x bulto", "precio por bulto", "precio x bulto", "pcio. x bulto", "precio bulto"]
    
    best_unit_idx = -1
    best_unit_score = -1
    
    for idx, col in enumerate(normalized):
        for kw in unit_keywords:
            if kw in col:
                score = len(kw)
                if score > best_unit_score:
                    best_unit_score = score
                    best_unit_idx = idx
        
        if best_unit_idx == -1 and "precio" in col and not any(bk in col for bk in bulk_keywords):
            score = 1
            if score > best_unit_score:
                best_unit_score = score
                best_unit_idx = idx
    
    if best_unit_idx == -1:
        best_bulk_idx = -1
        best_bulk_score = -1
        for idx, col in enumerate(normalized):
            for kw in bulk_keywords:
                if kw in col:
                    score = len(kw)
                    if score > best_bulk_score:
                        best_bulk_score = score
                        best_bulk_idx = idx
        return best_bulk_idx
    
    return best_unit_idx

def deduplicate_columns(columns):
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
            if isinstance(col, str) and col.lower().startswith("unnamed"):
                continue
                
            sample = safe_series_values(df.iloc[:, idx], 10)
            if not sample:
                continue
            
            if idx == 0:
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
            
            text_count = sum(1 for x in sample if isinstance(x, str) and len(x) > 3)
            if text_count >= 3:
                mapping[col] = "name"
                continue
            
            price_count = sum(1 for x in sample if isinstance(x, (int, float)) and not pd.isna(x))
            if price_count >= 3:
                mapping[col] = "price"
                continue
                
        except Exception as e:
            continue
    
    return mapping

def positional_mapping(df):
    n_cols = len(df.columns)
    if n_cols < 2:
        return {}
    
    mapping = {}
    start_idx = 0
    first_col_name = str(df.columns[0]).lower()
    if first_col_name.startswith("unnamed") or first_col_name == "nan":
        start_idx = 1
    
    if start_idx < n_cols:
        mapping[df.columns[start_idx]] = "code"
    
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

def process_single_sheet(df_raw, sheet_name=""):
    """Procesa UNA hoja. Misma lógica que antes, pero con detección de precio mejorada."""
    print(f"\n=== PROCESANDO HOJA: {sheet_name} ===")
    print(f"Shape raw: {df_raw.shape}")
    
    header_row = detect_header_row(df_raw)
    print(f"Header detectado: {header_row}")
    
    if header_row is None:
        print("  Sin header detectado, intentando mapeo posicional")
        df = pd.read_excel(BytesIO(file_bytes_global), header=None, engine=engine_used_global)
        mapping = positional_mapping(df)
        df = df.rename(columns=mapping)
    else:
        df = df_raw.iloc[header_row+1:].reset_index(drop=True)
        df.columns = df_raw.iloc[header_row]
        
        print(f"  Columnas originales: {list(df.columns)}")
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [" ".join(str(c) for c in col if pd.notna(c)).strip() for col in df.columns]
        
        # 🔑 NUEVO: Detectar qué columna de precio usar
        price_idx = detect_price_column(df.columns)
        if price_idx >= 0:
            price_col = df.columns[price_idx]
            print(f"  Columna de precio detectada: '{price_col}' (idx={price_idx})")
        
        df.columns = normalize_columns(df.columns)
        print(f"  Columnas normalizadas: {list(df.columns)}")
        
        df.columns = deduplicate_columns(list(df.columns))
        print(f"  Columnas deduplicadas: {list(df.columns)}")
        
        if "code" not in df.columns or "name" not in df.columns:
            print("  FALTAN COLUMNAS tras normalizar, intentando auto_map")
            auto_mapping = auto_map_columns(df)
            print("  AUTO MAP:", auto_mapping)
            df = df.rename(columns=auto_mapping)
    
    print(f"  COLUMNAS FINALES: {list(df.columns)}")
    
    if "code" not in df.columns or "name" not in df.columns:
        print("  FALTAN code o name, saltando hoja")
        return None
    
        # Conservar columnas del sistema + atributos dinámicos
    cols_to_keep = ["code", "name"]
    
    # Precios
    for price_col in ["price", "price_per_unit", "price_per_kg", "price_bulk"]:
        if price_col in df.columns:
            cols_to_keep.append(price_col)
    
    # Atributos dinámicos (todas las columnas que empiezan con attr_)
    for col in df.columns:
        if str(col).startswith("attr_"):
            cols_to_keep.append(col)
    
    df = df.dropna(how="all")
    df = df[cols_to_keep]
    
    df["code"] = df["code"].apply(clean_string)
    df["name"] = df["name"].apply(clean_string)
    if "price" in df.columns:
        df["price"] = df["price"].apply(clean_price)
    
    # 🔑 NUEVO: Filtrar productos sin precio o con precio 0
    mask = df["code"].notna() & df["name"].notna()
    df = df[mask]
    
    if "price" in df.columns:
        df = df[df["price"].notna() & (df["price"] > 0)]
    
    print(f"  Filas válidas: {len(df)}")
    if len(df) > 0:
        print(f"  Preview: {df.head(3).to_dict('records')}")
    
    return df

def upsert_product(cur, company_id, code, name, price, price_per_unit=None, price_per_kg=None, price_bulk=None, attributes=None):
    """
    Inserta o actualiza un producto.
    Ahora soporta precios alternativos y atributos dinámicos (color, talle, etc.)
    """
    if attributes is None:
        attributes = {}
    
    cur.execute("""
        INSERT INTO products (
            id, company_id, code, name, description,
            price, price_per_unit, price_per_kg, price_bulk,
            attributes, is_active, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, NOW(), NOW())
        ON CONFLICT (company_id, code)
        DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            price_per_unit = EXCLUDED.price_per_unit,
            price_per_kg = EXCLUDED.price_per_kg,
            price_bulk = EXCLUDED.price_bulk,
            attributes = EXCLUDED.attributes,
            updated_at = NOW()
    """, [
        str(uuid.uuid4()), company_id, code, name, name,
        price, price_per_unit, price_per_kg, price_bulk,
        json.dumps(attributes)
    ])
    print("  ROWCOUNT:", cur.rowcount)

# Variables globales para compartir entre funciones
file_bytes_global = None
engine_used_global = None

def handler(event, context):
    global file_bytes_global, engine_used_global
    
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
        file_bytes_global = response["Body"].read()
        
        # Leer TODAS las hojas
        try:
            all_sheets = pd.read_excel(BytesIO(file_bytes_global), sheet_name=None, header=None, engine="openpyxl")
            engine_used_global = "openpyxl"
        except Exception:
            all_sheets = pd.read_excel(BytesIO(file_bytes_global), sheet_name=None, header=None, engine="xlrd")
            engine_used_global = "xlrd"
        
        print(f"Total hojas encontradas: {len(all_sheets)}")
        print(f"Nombres de hojas: {list(all_sheets.keys())}")
        
        # Procesar cada hoja con la MISMA lógica de antes
        all_products = []
        for sheet_name, df_raw in all_sheets.items():
            df_processed = process_single_sheet(df_raw, sheet_name)
            if df_processed is not None and len(df_processed) > 0:
                all_products.append(df_processed)
        
        if not all_products:
            return {"statusCode": 400, "body": json.dumps({"error": "No se encontraron productos válidos"})}
        
        df_final = pd.concat(all_products, ignore_index=True)
        print(f"\nTOTAL PRODUCTOS A IMPORTAR: {len(df_final)}")
        
        # DB
        conn = get_connection()
        cur = conn.cursor()
        
        processed = 0
        skipped = 0
        
        for index in range(len(df_final)):
            try:
                row = df_final.iloc[index]
                
                # ========== CÓDIGO ==========
                raw_code = row["code"]
                if pd.isna(raw_code):
                    skipped += 1
                    continue
                
                if isinstance(raw_code, float):
                    if raw_code == int(raw_code):
                        code = str(int(raw_code))
                    else:
                        code = str(raw_code).strip()
                else:
                    code = str(raw_code).strip()
                
                if not code or code.lower() == "nan":
                    skipped += 1
                    continue
                
                # ========== NOMBRE ==========
                name = str(row["name"]).strip()
                
                # ========== PRECIOS ==========
                # Precio principal (obligatorio)
                price = row.get("price", None)
                if pd.isna(price):
                    price = None
                
                # Precios alternativos (opcionales)
                price_per_unit = clean_price(row.get("price_per_unit")) if "price_per_unit" in df_final.columns else None
                price_per_kg = clean_price(row.get("price_per_kg")) if "price_per_kg" in df_final.columns else None
                price_bulk = clean_price(row.get("price_bulk")) if "price_bulk" in df_final.columns else None
                
                # Si no hay precio principal ni precios alternativos, saltear
                all_prices = [p for p in [price, price_per_unit, price_per_kg, price_bulk] if p is not None]
                if not all_prices:
                    print(f"  SALTEANDO SIN PRECIO: code={code}, name={name}")
                    skipped += 1
                    continue
                
                # Usar el primer precio disponible como precio principal si no hay "price"
                if price is None and all_prices:
                    price = all_prices[0]
                
                # ========== ATRIBUTOS DINÁMICOS ==========
                # Buscar todas las columnas que empiecen con "attr_" en el DataFrame
                attributes = {}
                for col in df_final.columns:
                    if str(col).startswith("attr_"):
                        attr_name = str(col).replace("attr_", "")
                        attr_value = clean_string(row.get(col))
                        if attr_value:
                            attributes[attr_name] = attr_value
                
                # ========== LOG Y GUARDADO ==========
                print(f"PROCESANDO: code={code}, name={name}, price={price}, attrs={attributes}")
                upsert_product(
                    cur, 
                    company_id, 
                    code, 
                    name, 
                    float(price) if price else None,
                    price_per_unit,
                    price_per_kg,
                    price_bulk,
                    attributes if attributes else None
                )
                processed += 1
                
                if processed % 500 == 0:
                    conn.commit()
                    print(f"COMMIT BATCH: {processed}")
                    
            except Exception as row_error:
                try:
                    conn.rollback()
                except:
                    pass
                skipped += 1
                print(f"ERROR FILA {index}: {str(row_error)}")
        
        conn.commit()
        print("IMPORT FINALIZADO")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Importacion completada",
                "engine_used": engine_used_global,
                "total_sheets": len(all_sheets),
                "sheet_names": list(all_sheets.keys()),
                "total_products": len(df_final),
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