from decimal import Decimal


def clean_string(value):

    if value is None:
        return ""

    return str(value).strip()


def clean_price(value):

    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except:
        return None