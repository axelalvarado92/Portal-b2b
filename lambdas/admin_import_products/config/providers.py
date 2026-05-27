import pandas as pd

from parsers.generic import (
    map_generic_dataframe
)


PROVIDER_CONFIGS = {

    "MUNDIAL": {
        "skiprows": 6
    },

    "MARZO": {
        "skiprows": 6
    },

    "BUONA": {
        "skiprows": 1
    },

    "RADHA": {
        "sheet_name": "PEDIDO REPOSTERIA",
        "skiprows": 0
    },

    "LISTAN": {
        "sheet_name": "Productos",
        "skiprows": 0
    },

    "STASIO": {
        "multi_sheet": True,
        "sheets": [
            {
                "sheet_name": "LP GRANDES CLIENTES",
                "skiprows": 6
            },
            {
                "sheet_name": "LINEA PATRIA",
                "skiprows": 6
            },
            {
                "sheet_name": "LINEA MUNDIAL",
                "skiprows": 5
            }
        ]
    }
}


def detect_provider(file_name: str):

    upper_name = file_name.upper()

    for provider_key in PROVIDER_CONFIGS.keys():

        if provider_key in upper_name:
            return provider_key

    return "GENERIC"


def parse_excel(file_path: str, file_name: str):

    provider = detect_provider(file_name)

    config = PROVIDER_CONFIGS.get(provider, {})

    all_products = []

    # MULTI SHEET
    if config.get("multi_sheet"):

        for sheet in config["sheets"]:

            df = pd.read_excel(
                file_path,
                sheet_name=sheet["sheet_name"],
                skiprows=sheet["skiprows"],
                dtype=str
            )

            products = map_generic_dataframe(df)

            all_products.extend(products)

        return all_products

    # SINGLE SHEET
    df = pd.read_excel(
        file_path,
        sheet_name=config.get("sheet_name", 0),
        skiprows=config.get("skiprows", 0),
        dtype=str
    )

    return map_generic_dataframe(df)