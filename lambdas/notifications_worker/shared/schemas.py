# shared/schemas.py

def validate_required_fields(body, required_fields):
    """
    Verifica que los campos requeridos estén presentes en el body.
    Devuelve un mensaje de error o None si todo está bien.
    """
    if not isinstance(body, dict):
        return "El body debe ser un objeto JSON"
    
    missing = [field for field in required_fields if field not in body or body[field] == ""]
    if missing:
        return f"Campos requeridos faltantes: {', '.join(missing)}"
    
    return None


# Auth
def validate_confirm_user(body):
    return validate_required_fields(body, ["user_id"])


# Cart
def validate_add_cart_item(body):
    return validate_required_fields(body, ["product_id", "quantity", "company_id"])

def validate_update_cart_item(body):
    return validate_required_fields(body, ["quantity"])


# Orders
def validate_create_order(body):
    return validate_required_fields(body, ["company_id", "cart_id"])


# Admin - usuarios
def validate_create_user(body):
    return validate_required_fields(body, ["email", "full_name", "role"])

def validate_update_user(body):
    return validate_required_fields(body, ["is_active"])


# Admin - empresas
def validate_create_company(body):
    return validate_required_fields(body, ["name", "contact_email"])

def validate_update_company(body):
    if not isinstance(body, dict):
        return "El body debe ser un objeto JSON"
    allowed = {"name", "logo_url", "description", "contact_email", "is_active", 
               "notification_emails", "whatsapp_phone"}
    if not any(field in body for field in allowed):
        return "Debés enviar al menos un campo para actualizar"
    return None


# Admin - productos
def validate_create_product(body):
    return validate_required_fields(body, ["company_id", "name"])

def validate_update_product(body):
    if not isinstance(body, dict):
        return "El body debe ser un objeto JSON"
    allowed = {"name", "code", "description", "image_url", "price", 
               "has_stock", "stock_quantity", "unit_type", "is_active", "category_id"}
    if not any(field in body for field in allowed):
        return "Debés enviar al menos un campo para actualizar"
    return None

def validate_create_payment(body):
    required_fields = [
        "user_id",
        "company_id",
        "amount",
        "payment_method"
    ]

    for field in required_fields:
        if field not in body:
            return f"{field} es requerido"

    try:
        amount = float(body["amount"])

        if amount <= 0:
            return "amount debe ser mayor a 0"

    except:
        return "amount inválido"

    allowed_methods = [
        "cash",
        "transfer",
        "check"
    ]

    if body["payment_method"] not in allowed_methods:
        return "payment_method inválido"

    return None

def validate_create_note(body):

    required = [
        "user_id",
        "company_id",
        "type",
        "reason",
        "amount"
    ]

    for field in required:
        if field not in body:
            return f"{field} es requerido"

    if body["type"] not in ["credit", "debit"]:
        return "type debe ser credit o debit"

    try:
        amount = float(body["amount"])

        if amount <= 0:
            return "amount debe ser mayor a 0"

    except:
        return "amount inválido"

    return None

def validate_create_invoice(body):

    required = [
        "order_id",
        "external_invoice_number",
        "items"
    ]

    for field in required:

        if field not in body:
            return f"{field} es requerido"

    if not isinstance(body["items"], list):
        return "items debe ser una lista"

    if len(body["items"]) == 0:
        return "Debe enviar al menos un item"

    for item in body["items"]:

        if "order_item_id" not in item:
            return "order_item_id es requerido"

        if "invoiced_unit_price" not in item:
            return "invoiced_unit_price es requerido"

    return None