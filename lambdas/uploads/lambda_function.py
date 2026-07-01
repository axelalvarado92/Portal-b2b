import os
import json
import uuid
import boto3
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.utils import success

s3 = boto3.client("s3")

BUCKET = os.environ["ASSETS_BUCKET"]
ASSETS_URL = os.environ["ASSETS_URL"]


def handler(event, context):
    body = json.loads(event["body"])
    extension = body["extension"]
    
    # Intentamos obtener company_id, si no viene, asumimos que es un producto
    company_id = body.get("company_id")
    
    # Generamos la ruta dinámicamente
    if company_id:
        filename = f"companies/{company_id}.{extension}"
    else:
        # Generamos un ID único para el producto si no hay company_id
        product_id = str(uuid.uuid4())
        filename = f"products/{product_id}.{extension}"
    
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET,
            "Key": filename,
            "ContentType": body["content_type"]
        },
        ExpiresIn=300
    )

    file_url = f"{ASSETS_URL}/{filename}"

    return success({
        "upload_url": upload_url,
        "file_url": file_url
    })