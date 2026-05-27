from parsers.base_parser import BaseParser
from utils.excel import read_excel
from utils.normalize import clean_string, clean_price


class StasioParser(BaseParser):

    SHEETS = [
        {
            "sheet": "LP GRANDES CLIENTES",
            "skiprows": 6
        },
        {
            "sheet": "LINEA PATRIA",
            "skiprows": 6
        },
        {
            "sheet": "LINEA MUNDIAL",
            "skiprows": 5
        }
    ]

    def parse(self, filepath):

        products = []

        for config in self.SHEETS:

            try:

                print(f"Leyendo hoja: {config['sheet']}")

                df = read_excel(
                    filepath,
                    sheet_name=config["sheet"],
                    skiprows=config["skiprows"]
                )

                for _, row in df.iterrows():

                    code = clean_string(
                        row.get("CÓDIGO") or
                        row.get("CODIGO")
                    )

                    description = clean_string(
                        row.get("DETALLE") or
                        row.get("DESCRIPCION")
                    )

                    price = clean_price(
                        row.get("PRECIO")
                    )

                    if not code or not price:
                        continue

                    products.append({
                        "codigo": code,
                        "descripcion": description,
                        "precio": float(price),
                        "categoria": config["sheet"]
                    })

            except Exception as e:

                print(f"Error hoja {config['sheet']}: {str(e)}")

        return products