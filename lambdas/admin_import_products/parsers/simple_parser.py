from parsers.base_parser import BaseParser
from utils.excel import read_excel
from utils.normalize import clean_string, clean_price
from utils.validators import is_valid_product


class SimpleParser(BaseParser):

    def parse(self, filepath):

        df = read_excel(filepath)

        products = []

        for _, row in df.iterrows():

            code = clean_string(row.get("Código") or row.get("CODIGO"))
            description = clean_string(
                row.get("Descripción") or
                row.get("DESCRIPCION") or
                row.get("DETALLE")
            )

            price = clean_price(
                row.get("Precio") or
                row.get("PRECIO")
            )

            if not is_valid_product(code, price):
                continue

            products.append({
                "codigo": code,
                "descripcion": description,
                "precio": float(price),
                "categoria": None
            })

        return products