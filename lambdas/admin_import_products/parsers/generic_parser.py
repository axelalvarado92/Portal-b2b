import pandas as pd
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normaliza nombres de columnas.
    """
    df.columns = [
        str(col)
        .strip()
        .upper()
        .replace("Ó", "O")
        .replace("Á", "A")
        .replace("É", "E")
        .replace("Í", "I")
        .replace("Ú", "U")
        for col in df.columns
    ]

    return df


def clean_string(value) -> str:
    """
    Limpia strings y evita None.
    """
    if pd.isna(value):
        return ""

    return str(value).strip()


def clean_price(value):
    """
    Convierte precio a Decimal seguro.
    """
    if pd.isna(value):
        return None

    try:
        value = str(value).replace(",", ".").strip()
        return Decimal(value).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def detect_column(df: pd.DataFrame, possible_names: List[str]):
    """
    Detecta automáticamente una columna válida.
    """
    normalized = {col.upper(): col for col in df.columns}

    for name in possible_names:
        if name.upper() in normalized:
            return normalized[name.upper()]

    return None


def map_generic_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Mapea cualquier dataframe genérico al formato estándar.
    """

    df = normalize_columns(df)

    code_col = detect_column(df, [
        "CODIGO",
        "CÓDIGO",
        "SKU",
        "ID_PRODUCTO",
        "ID PRODUCTO"
    ])

    desc_col = detect_column(df, [
        "DESCRIPCION",
        "DESCRIPCIÓN",
        "DETALLE",
        "PRODUCTO",
        "NOMBRE"
    ])

    price_col = detect_column(df, [
        "PRECIO",
        "PRECIO UNITARIO",
        "LISTA",
        "COSTO"
    ])

    if not code_col:
        raise Exception("No se encontró columna código")

    if not price_col:
        raise Exception("No se encontró columna precio")

    products = []

    current_category = None

    for idx, row in df.iterrows():

        raw_code = clean_string(row.get(code_col))
        raw_desc = clean_string(row.get(desc_col)) if desc_col else ""
        raw_price = row.get(price_col)

        price = clean_price(raw_price)

        # Detectar categoría tipo:
        # ['VINCHAS']
        if (
            raw_code
            and not raw_desc
            and price is None
        ):
            current_category = raw_code
            continue

        if not raw_code:
            continue

        if price is None:
            continue

        product = {
            "sku": raw_code,
            "description": raw_desc,
            "price": float(price),
            "category": current_category
        }

        products.append(product)

    return products