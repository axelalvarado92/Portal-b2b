resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = var.block_public_acls
  block_public_policy     = var.block_public_policy
  ignore_public_acls      = var.ignore_public_acls
  restrict_public_buckets = var.restrict_public_buckets
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "Expire old versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 7

    }
  }
}

resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  cors_rule {
    allowed_origins = [
      "http://localhost:5173",
      "https://d1pijo2eponbrv.cloudfront.net",
      "https://snbrepresentaciones.com.ar"
    ]

    allowed_methods = ["PUT", "GET", "POST", "DELETE"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "public_read" {

  count  = var.bucket_purpose == "uploads" ? 1 : 0

  bucket = aws_s3_bucket.this.id

  policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {

        Sid = "PublicRead"

        Effect = "Allow"

        Principal = "*"

        Action = "s3:GetObject"

        Resource = "${aws_s3_bucket.this.arn}/*"

      }

    ]

  })

}