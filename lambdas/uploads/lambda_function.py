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

    company_id = body["company_id"]

    filename = f"companies/{company_id}.{extension}"
    
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