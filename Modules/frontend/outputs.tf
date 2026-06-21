output "cloudfront_domain" {
  description = "dominio del frontend "
  value = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "bucket_name" {
    description = "nombre del bucket"
    value = aws_s3_bucket.frontend_bucket.bucket
  
}

output "cloudfront_id" {
    description = "id de la distribucion cloudfront"
    value = aws_cloudfront_distribution.frontend_distribution.id
  
}