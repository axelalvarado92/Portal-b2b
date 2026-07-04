resource "aws_s3_bucket" "frontend_bucket" {
    bucket = "${var.project_name}-${var.environment}-frontend-47148"
    force_destroy = var.force_destroy
    
}

resource "aws_s3_bucket_public_access_block" "public_access_block" {
    bucket = aws_s3_bucket.frontend_bucket.id
    
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  
}

resource "aws_cloudfront_origin_access_control" "origin_access" {
    name = "${var.project_name}-${var.environment}-oac-47148"
    origin_access_control_origin_type = "s3"
    signing_behavior = "always"
    signing_protocol = "sigv4"
  
}

resource "aws_cloudfront_distribution" "frontend_distribution" {

  aliases = var.domain_name != null ? [var.domain_name] : []
    
    origin {
        domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
        origin_id = "s3-origin"
        origin_access_control_id = aws_cloudfront_origin_access_control.origin_access.id
    }

    default_cache_behavior {
      target_origin_id = "s3-origin"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods = ["GET", "HEAD"]
      cached_methods = ["GET", "HEAD"]
      forwarded_values {
        query_string = false
        cookies {
          forward = "none"
        }
      }
      min_ttl = 0
      default_ttl = var.default_ttl
      max_ttl = 86400
    }
    enabled = true
    default_root_object = var.default_root_object
    restrictions {
        geo_restriction {
          restriction_type = "none"
      }
    }
    viewer_certificate {
      cloudfront_default_certificate = var.domain_name != null ? false : true
      acm_certificate_arn = var.domain_name != null ? var.certificate_arn : null
      ssl_support_method = var.domain_name != null ? "sni-only" : null
    }

    custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
}



data "aws_iam_policy_document" "cloudfront_policy_document" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadOnly"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend_distribution.arn]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend_bucket.arn}/*"]
  }
  
}
  


resource "aws_s3_bucket_policy" "cloudfront_policy" {
    bucket = aws_s3_bucket.frontend_bucket.id
    policy = data.aws_iam_policy_document.cloudfront_policy_document.json

}


resource "null_resource" "sync_s3" {
  # Solo se dispara si algo cambia en el código fuente del frontend
  triggers = {
    # Cambia esto por un hash de tus archivos fuente para no depender del timestamp
    build_hash = "${md5(join("", [for f in fileset(path.module, "../../frontend/src/**/*") : filesha1(f)]))}"
  }

  provisioner "local-exec" {
    # Hemos quitado el backslash y unido los comandos con &&
    # Ejemplo de cómo añadir la invalidación al final de la cadena
command = "cd ../../frontend && npm install && npm run build && aws s3 sync dist s3://${aws_s3_bucket.frontend_bucket.id} --delete --profile seba-account && aws cloudfront create-invalidation --distribution-id E2BLXG4R00QL6E --paths /* --profile seba-account"
  }
}


