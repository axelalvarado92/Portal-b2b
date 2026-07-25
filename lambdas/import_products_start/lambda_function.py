import json
import boto3
import os

from shared.auth_utils import require_auth
from shared.utils import (
    bad_request,
    server_error,
    response
)

# ---------------------------------------------------
# CLIENTS
# ---------------------------------------------------

lambda_client = boto3.client("lambda")
s3_client = boto3.client("s3")

# ---------------------------------------------------
# ENV
# ---------------------------------------------------

WORKER_FUNCTION_NAME = os.environ["WORKER_FUNCTION_NAME"]
IMPORTS_BUCKET = os.environ["IMPORTS_BUCKET"]

# ---------------------------------------------------
# HELPERS
# ---------------------------------------------------

def accepted(data):
    return response(202, data=data)

def ok(data):
    return response(200, data=data)

# ---------------------------------------------------
# PRESIGN HANDLER
# ---------------------------------------------------

def handle_presign(body):

    company_id = body.get("company_id")
    file_name = body.get("file_name")

    if not company_id:
        return bad_request("Falta company_id")

    if not file_name:
        return bad_request("Falta file_name")

    import time
    import re

    clean_name = re.sub(r"[^a-zA-Z0-9.]", "_", file_name)
    timestamp = int(time.time() * 1000)

    s3_key = f"uploads/companies/{company_id}/{timestamp}_{clean_name}"

    presigned_url = s3_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": IMPORTS_BUCKET,
            "Key": s3_key,
            "ContentType": "application/octet-stream"       # para que soporte xlsx y xsl
        },
        ExpiresIn=300  # 5 minutos
    )

    return ok({
        "upload_url": presigned_url,
        "s3_key": s3_key
    })

# ---------------------------------------------------
# IMPORT HANDLER (el que ya tenías)
# ---------------------------------------------------

def handle_import(user, body):

    s3_key = body.get("s3_key")

    if not s3_key:
        return bad_request("Falta s3_key")

    company_id = (
        body.get("company_id")
        or user.get("company_id")
    )

    if not company_id:
        return bad_request("Company no encontrado")

    worker_payload = {
        "company_id": company_id,
        "s3_key": s3_key
    }

    print("INVOKING WORKER")
    print(worker_payload)

    lambda_client.invoke(
        FunctionName=WORKER_FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps(worker_payload)
    )

    return accepted({
        "message": "Importacion iniciada",
        "company_id": company_id,
        "s3_key": s3_key
    })

# ---------------------------------------------------
# HANDLER PRINCIPAL
# ---------------------------------------------------

def handler(event, context):

    user, error = require_auth(event)

    if error:
        return error

    try:

        path = event["requestContext"]["http"]["path"]
        body = json.loads(event.get("body") or "{}")

        if path.endswith("/presign"):
            return handle_presign(body)

        return handle_import(user, body)

    except Exception as e:

        print("ERROR:")
        print(str(e))

        return server_error(str(e))