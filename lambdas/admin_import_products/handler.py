import json
import boto3
import tempfile
import os

from detectors.detector import detect_parser

s3 = boto3.client("s3")


def lambda_handler(event, context):

    try:
        bucket = event["bucket"]
        key = event["key"]

        print(f"Procesando archivo: s3://{bucket}/{key}")

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            s3.download_fileobj(bucket, key, tmp)
            local_file = tmp.name

        parser = detect_parser(local_file, key)

        print(f"Parser detectado: {parser.__class__.__name__}")

        products = parser.parse(local_file)

        print(f"Productos parseados: {len(products)}")

        # TODO:
        # guardar en DynamoDB/RDS

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Importación exitosa",
                "products": len(products)
            })
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")

        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }