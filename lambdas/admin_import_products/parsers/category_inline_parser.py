from parsers.base_parser import BaseParser
from utils.normalize import clean_price


import pandas as pd


class CategoryInlineParser(BaseParser):

    def parse(self, filepath):

        if filepath.endswith(".xls"):
            engine = "xlrd"
        else:
            engine = "openpyxl"

        df = pd.read_excel(
            filepath,
            header=None,
            engine=engine,
            dtype=str
        )

        categoria_actual = None

        products = []

        for idx, row in df.iterrows():

            values = [
                str(v).strip()
                for v in row.tolist()
                if pd.notna(v)
            ]

            print(f"Fila {idx}: {values}")

            if len(values) == 1:

                categoria_actual = values[0]

                print(f"Nueva categoría: {categoria_actual}")

                continue

            if len(values) >= 3:

                code = values[0].strip()
                description = values[1].strip()
                price = clean_price(values[-1])

                if not price:
                    continue

                products.append({
                    "codigo": code,
                    "descripcion": description,
                    "precio": float(price),
                    "categoria": categoria_actual
                })

        return products