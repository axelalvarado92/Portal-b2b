import json
import boto3
import os

# ---------------------------------------------------
# CLIENT
# ---------------------------------------------------

lambda_client = boto3.client("lambda")

# ---------------------------------------------------
# ENV
# ---------------------------------------------------

WORKER_FUNCTION_NAME = os.environ["WORKER_FUNCTION_NAME"]

# ---------------------------------------------------
# HANDLER
# ---------------------------------------------------

def handler(event, context):

    try:

        # ---------------------------------------------------
        # BODY
        # ---------------------------------------------------

        body = json.loads(event.get("body") or "{}")

        s3_key = body.get("s3_key")

        if not s3_key:

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Falta s3_key"
                })
            }

        # ---------------------------------------------------
        # JWT CLAIMS
        # ---------------------------------------------------

        claims = (
            event.get("requestContext", {})
            .get("authorizer", {})
            .get("jwt", {})
            .get("claims", {})
        )

        company_id = (
            claims.get("custom:company_id")
            or claims.get("company_id")
            or body.get("company_id")
        )

        if not company_id:

            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Company no encontrado"
                })
            }

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

        return {
            "statusCode": 202,
            "body": json.dumps({
                "message": "Importacion iniciada",
                "company_id": company_id,
                "s3_key": s3_key
            })
        }

    except Exception as e:

        print("ERROR:")
        print(str(e))

        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }