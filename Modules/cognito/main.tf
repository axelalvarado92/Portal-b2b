### base de datos de usuario ###
resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.project_name}-${var.environment}-user-pool"

  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = false
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
  }

    schema {
  name                = "role"
  attribute_data_type = "String"
  mutable             = true

  string_attribute_constraints {
    min_length = 3
    max_length = 10
  }
 }

 lambda_config {
    post_confirmation = var.post_confirmation_lambda_arn
  }
}

### La aplicación que puede usar User Pool ###
resource "aws_cognito_user_pool_client" "app_client" {
  name         = var.app_client_name
  user_pool_id = aws_cognito_user_pool.user_pool.id
 
  read_attributes  = ["email", "name", "custom:role"]
  write_attributes = ["email", "name", "custom:role"]

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
    
  ]
  ### duracion de los tokens ###
  access_token_validity  = 1          
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

resource "aws_lambda_permission" "postconfirmation" {
  statement_id  = "AllowCognitoPostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = var.post_confirmation_lambda_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.user_pool.arn
}

