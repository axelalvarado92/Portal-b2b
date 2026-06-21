resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {

    allow_origins = var.allow_origins

    allow_methods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ]

    allow_headers = [
      "*"
    ]

    expose_headers = [
      "*"
    ]

    max_age = 300
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id          = aws_apigatewayv2_api.http_api.id
  name            = "jwt-authorizer"
  authorizer_type = "JWT"

  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [var.app_client]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${var.user_pool}"
  }
}

# Una integración por lambda
resource "aws_apigatewayv2_integration" "integrations" {
  for_each = var.lambda_integrations

  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = each.value.invoke_arn
  payload_format_version = "2.0"
}

# Aplanamos el mapa de lambdas en una lista de rutas individuales
locals {
  all_routes = flatten([
    for lambda_key, lambda in var.lambda_integrations : [
      for route in lambda.routes : {
        key        = "${lambda_key}_${route.method}_${replace(route.path, "/", "_")}"
        lambda_key = lambda_key
        method     = route.method
        path       = route.path
        protected  = route.protected
      }
    ]
  ])

  routes_map = { for r in local.all_routes : r.key => r }
}

# Una ruta por cada método/path
resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes_map

  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "${each.value.method} ${each.value.path}"
  target    = "integrations/${aws_apigatewayv2_integration.integrations[each.value.lambda_key].id}"

  authorization_type = each.value.protected ? "JWT" : "NONE"
  authorizer_id      = each.value.protected ? aws_apigatewayv2_authorizer.jwt.id : null
}

data "aws_caller_identity" "current" {}

# Un permiso por cada lambda
resource "aws_lambda_permission" "permissions" {
  for_each = var.lambda_integrations

  statement_id  = "AllowAPIGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.http_api.id}/*/*"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

output "api_url" {
  description = "Invoke URL of the API Gateway"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}