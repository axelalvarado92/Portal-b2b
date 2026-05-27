import pandas as pd


def read_excel(filepath, sheet_name=0, skiprows=0):

    if filepath.endswith(".xls"):
        engine = "xlrd"
    else:
        engine = "openpyxl"

    return pd.read_excel(
        filepath,
        sheet_name=sheet_name,
        skiprows=skiprows,
        engine=engine,
        dtype=str
    )