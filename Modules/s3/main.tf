resource "aws_s3_bucket" "imports" {
  bucket = "${var.project_name}-${var.environment}-imports-47148"
  force_destroy = var.force_destroy
}

resource "aws_s3_bucket_versioning" "imports" {
  bucket = aws_s3_bucket.imports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "imports" {
  bucket = aws_s3_bucket.imports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "imports" {
  bucket = aws_s3_bucket.imports.id

  rule {
    id     = "Expire old versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 7

    }
  }
}