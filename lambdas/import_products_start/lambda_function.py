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
# CLIENT
# ---------------------------------------------------

lambda_client = boto3.client("lambda")

# ---------------------------------------------------
# ENV
# ---------------------------------------------------

WORKER_FUNCTION_NAME = os.environ["WORKER_FUNCTION_NAME"]

# ---------------------------------------------------
# HELPERS
# ---------------------------------------------------

def accepted(data):
    return response(202, data=data)

# ---------------------------------------------------
# HANDLER
# ---------------------------------------------------

def handler(event, context):

    user, error = require_auth(event)

    if error:
        return error

    try:

        # ---------------------------------------------------
        # BODY
        # ---------------------------------------------------

        body = json.loads(event.get("body") or "{}")

        s3_key = body.get("s3_key")

        if not s3_key:
            return bad_request("Falta s3_key")

        # ---------------------------------------------------
        # COMPANY
        # ---------------------------------------------------

        company_id = (
            user.get("company_id")
            or body.get("company_id")
        )

        if not company_id:
            return bad_request("Company no encontrado")

        # ---------------------------------------------------
        # PAYLOAD WORKER
        # ---------------------------------------------------

        worker_payload = {
            "company_id": company_id,
            "s3_key": s3_key
        }

        print("INVOKING WORKER")
        print(worker_payload)

        # ---------------------------------------------------
        # ASYNC INVOCATION
        # ---------------------------------------------------

        lambda_client.invoke(
            FunctionName=WORKER_FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps(worker_payload)
        )

        # ---------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------

        return accepted({
            "message": "Importacion iniciada",
            "company_id": company_id,
            "s3_key": s3_key
        })

    except Exception as e:

        print("ERROR:")
        print(str(e))

        return server_error(str(e))