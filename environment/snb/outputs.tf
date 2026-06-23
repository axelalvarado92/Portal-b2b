output "api_base_url" {
  description = "Base URL del API Gateway"
  value       = module.apigateway.api_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

data "aws_caller_identity" "current" {}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "cloudfront_domain" {
  description = "dominio del frontend "
  value = module.frontend.cloudfront_domain
}

output "bucket_name" {
    description = "nombre del bucket"
    value = module.frontend.bucket_name
}

output "cloudfront_id" {
    description = "id de la distribucion cloudfront"
    value = module.frontend.cloudfront_id
  
}

output "nameservers" {
  description = "Nameservers para configurar en NIC.AR"
  value       = aws_route53_zone.main.name_servers
}


