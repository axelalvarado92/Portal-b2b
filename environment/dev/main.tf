########################################################################
#                             LOCALS
########################################################################

locals {
  lambda_names = [
    "auth", "users", "companies", "products",
    "cart", "orders", "admin", "notifications_worker", "payments",
    "credit_notes", "commissions", "invoices", "reports", "postconfirmation", "admin_import_products",
    "import_products_start", "account_requests"
  ]

  lambda_defaults = {
    handler     = "lambda_function.handler"
    memory_size = 128
    timeout     = 10
    managed_policy_arns = [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    ]
  }

  common_layers = [
    aws_lambda_layer_version.psycopg2_layer.arn
  ]
}

########################################################################
#                             LAYERS
########################################################################

resource "aws_lambda_layer_version" "psycopg2_layer" {
  filename            = "${path.module}/../../build/psycopg2_layer.zip"
  layer_name          = "psycopg2-layer"
  compatible_runtimes = ["python3.12"]
  source_code_hash = filebase64sha256("${path.module}/../../build/psycopg2_layer.zip")
}

resource "aws_lambda_layer_version" "reportlab_layer" {
  filename            = "${path.module}/../../build/reportlab_layer.zip"
  layer_name          = "reportlab-layer"
  compatible_runtimes = ["python3.12"]
  source_code_hash = filebase64sha256("${path.module}/../../build/reportlab_layer.zip")
}

resource "aws_lambda_layer_version" "openpyxl_layer" {
  filename            = "${path.module}/../../build/openpyxl_layer.zip"
  layer_name          = "openpyxl-layer"
  compatible_runtimes = ["python3.12"]
  source_code_hash = filebase64sha256("${path.module}/../../build/openpyxl_layer.zip")
}

resource "aws_lambda_layer_version" "xlrd_layer" {
  filename            = "${path.module}/../../build/xlrd_layer.zip"
  layer_name          = "xlrd-layer"
  compatible_runtimes = ["python3.12"]
  source_code_hash = filebase64sha256("${path.module}/../../build/xlrd_layer.zip")
}

resource "aws_lambda_layer_version" "pandas_layer" {
  filename            = "${path.module}/../../build/pandas_layer.zip"
  layer_name          = "pandas-layer"
  compatible_runtimes = ["python3.12"]

  source_code_hash = filebase64sha256(
    "${path.module}/../../build/pandas_layer.zip"
  )
}
########################################################################
#                          LAMBDA ZIPs
########################################################################

data "archive_file" "lambda_zips" {
  for_each    = toset(local.lambda_names)
  type        = "zip"
  source_dir  = "${path.module}/../../lambdas/${each.key}"
  output_path = "${path.module}/../../build/${each.key}.zip"
}

########################################################################
#                             LAMBDAS
########################################################################

module "lambda_auth" {
  source = "../../modules/lambda"

  function_name       = "lambda-auth"
  filename            = data.archive_file.lambda_zips["auth"].output_path
  source_code_hash    = data.archive_file.lambda_zips["auth"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
    COGNITO_CLIENT_ID = var.cognito_client_id
  }
}

module "lambda_account_requests" {
  source = "../../modules/lambda"

  function_name       = "lambda-account-requests"

  filename         = data.archive_file.lambda_zips["account_requests"].output_path
  source_code_hash = data.archive_file.lambda_zips["account_requests"].output_base64sha256

  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout

  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_users" {
  source = "../../modules/lambda"

  function_name       = "lambda-users"
  filename            = data.archive_file.lambda_zips["users"].output_path
  source_code_hash    = data.archive_file.lambda_zips["users"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_companies" {
  source = "../../modules/lambda"

  function_name       = "lambda-companies"
  filename            = data.archive_file.lambda_zips["companies"].output_path
  source_code_hash    = data.archive_file.lambda_zips["companies"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_products" {
  source = "../../modules/lambda"

  function_name       = "lambda-products"
  filename            = data.archive_file.lambda_zips["products"].output_path
  source_code_hash    = data.archive_file.lambda_zips["products"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_cart" {
  source = "../../modules/lambda"

  function_name       = "lambda-cart"
  filename            = data.archive_file.lambda_zips["cart"].output_path
  source_code_hash    = data.archive_file.lambda_zips["cart"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_orders" {
  source = "../../modules/lambda"

  function_name       = "lambda-orders"
  filename            = data.archive_file.lambda_zips["orders"].output_path
  source_code_hash    = data.archive_file.lambda_zips["orders"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers
  sqs_queue_arns      = [module.sqs.sqs_arn]

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
    QUEUE_URL    = module.sqs.sqs_url
  }
}

module "lambda_admin" {
  source = "../../modules/lambda"

  function_name       = "lambda-admin"
  filename            = data.archive_file.lambda_zips["admin"].output_path
  source_code_hash    = data.archive_file.lambda_zips["admin"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  enable_cognito_admin = true

  cognito_user_pool_arn = module.cognito.user_pool_arn

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
    USER_POOL_ID = module.cognito.user_pool_id
  }
}

module "lambda_notifications_worker" {
  source = "../../modules/lambda"

  function_name       = "lambda-notifications-worker"
  filename            = data.archive_file.lambda_zips["notifications_worker"].output_path
  source_code_hash    = data.archive_file.lambda_zips["notifications_worker"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = 256
  timeout             = 30
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers = concat(
    local.common_layers,
    [aws_lambda_layer_version.reportlab_layer.arn]
  )
  ses_enabled    = true
  sqs_queue_arns = [module.sqs.sqs_arn]

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
    SENDER_EMAIL = var.ses_sender_email
  }
}

module "lambda_payments" {
  source = "../../modules/lambda"

  function_name       = "lambda-payments"
  filename            = data.archive_file.lambda_zips["payments"].output_path
  source_code_hash    = data.archive_file.lambda_zips["payments"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url

  }
}

module "lambda_credit_notes" {
  source = "../../modules/lambda"

  function_name       = "lambda-credit-notes"
  filename            = data.archive_file.lambda_zips["credit_notes"].output_path
  source_code_hash    = data.archive_file.lambda_zips["credit_notes"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_commissions" {
  source = "../../modules/lambda"

  function_name       = "lambda-commissions"
  filename            = data.archive_file.lambda_zips["commissions"].output_path
  source_code_hash    = data.archive_file.lambda_zips["commissions"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_invoices" {
  source = "../../modules/lambda"

  function_name       = "lambda-invoices"
  filename            = data.archive_file.lambda_zips["invoices"].output_path
  source_code_hash    = data.archive_file.lambda_zips["invoices"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = 256
  timeout             = 30
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_reports" {
  source = "../../modules/lambda"

  function_name    = "lambda-reports"
  filename         = data.archive_file.lambda_zips["reports"].output_path
  source_code_hash = data.archive_file.lambda_zips["reports"].output_base64sha256

  handler = local.lambda_defaults.handler

  memory_size = 1024
  timeout     = 120

  managed_policy_arns = local.lambda_defaults.managed_policy_arns

  layers = concat(
    local.common_layers,
    [aws_lambda_layer_version.reportlab_layer.arn]
  )

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
  }
}

module "lambda_postconfirmation" {
  source = "../../modules/lambda"

  function_name       = "lambda-postconfirmation"
  filename            = data.archive_file.lambda_zips["postconfirmation"].output_path
  source_code_hash    = data.archive_file.lambda_zips["postconfirmation"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = local.lambda_defaults.memory_size
  timeout             = local.lambda_defaults.timeout
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers              = local.common_layers

  environment_variables = {
    DATABASE_URL          = module.postgresql.database_url
    DB_HOST               = var.db_host
    DB_PORT               = var.db_port
    DB_NAME               = var.db_name
    DB_USER               = var.db_user
    DB_PASSWORD           = var.db_password
    BOOTSTRAP_ADMIN_EMAIL = var.bootstrap_admin_email
  }
}

module "lambda_admin_import_products" {
  source = "../../modules/lambda"

  function_name       = "lambda-admin-import-products"
  filename            = data.archive_file.lambda_zips["admin_import_products"].output_path
  source_code_hash    = data.archive_file.lambda_zips["admin_import_products"].output_base64sha256
  handler             = local.lambda_defaults.handler
  memory_size         = 1024
  timeout             = 300
  managed_policy_arns = local.lambda_defaults.managed_policy_arns
  layers = concat(
  local.common_layers,
  [
    aws_lambda_layer_version.pandas_layer.arn,
    aws_lambda_layer_version.openpyxl_layer.arn,
    aws_lambda_layer_version.xlrd_layer.arn
  ]
)

s3_bucket_arns = [
    module.s3.imports_bucket_arn
  ]

  environment_variables = {
    DATABASE_URL = module.postgresql.database_url
    IMPORTS_BUCKET = module.s3.imports_bucket_name
  }
}

module "lambda_import_products_start" {
  source = "../../modules/lambda"

  function_name       = "lambda-import-products-start"
  filename            = data.archive_file.lambda_zips["import_products_start"].output_path
  source_code_hash    = data.archive_file.lambda_zips["import_products_start"].output_base64sha256

  handler             = local.lambda_defaults.handler

  memory_size         = 128
  timeout             = 10

  managed_policy_arns = local.lambda_defaults.managed_policy_arns

  s3_bucket_arns = [
  module.s3.imports_bucket_arn
]

  layers = local.common_layers
  
  lambda_invoke_arns = [
  module.lambda_admin_import_products.lambda_arn
]

  environment_variables = {
    WORKER_FUNCTION_NAME = module.lambda_admin_import_products.lambda_function_name
    DATABASE_URL          = module.postgresql.database_url
    IMPORTS_BUCKET         = module.s3.imports_bucket_name

  }
}



########################################################################
#                          COGNITO TRIGGERS
########################################################################

resource "aws_lambda_permission" "cognito_auth" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_postconfirmation.lambda_function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito.user_pool_arn
}

########################################################################
#                              SES
########################################################################

resource "aws_ses_email_identity" "sender" {
  email = var.ses_sender_email
}

########################################################################
#                            SQS TRIGGER
########################################################################

resource "aws_lambda_event_source_mapping" "notifications_trigger" {
  event_source_arn = module.sqs.sqs_arn
  function_name    = module.lambda_notifications_worker.lambda_function_name

  depends_on = [
    module.lambda_notifications_worker,
    module.sqs
  ]
}

########################################################################
#                           API GATEWAY
########################################################################

module "apigateway" {
  source = "../../modules/apigateway"

  project_name  = var.project_name
  environment   = var.environment
  region        = var.region
  user_pool     = module.cognito.user_pool_id
  app_client    = module.cognito.user_pool_client_id

  allow_origins = ["http://localhost:5173","https://d1pijo2eponbrv.cloudfront.net"]

  lambda_integrations = {
    auth = {
      invoke_arn    = module.lambda_auth.lambda_invoke_arn
      function_name = module.lambda_auth.lambda_function_name
      routes = [
        { method = "POST", path = "/auth/confirm", protected = false },
        { method = "POST", path = "/auth/login", protected = false },
        { method = "POST", path = "/auth/refresh", protected = false },
      ]
    }
    
    account_requests = {
      invoke_arn    = module.lambda_account_requests.lambda_invoke_arn
      function_name = module.lambda_account_requests.lambda_function_name
      routes = [
        { method = "POST", path = "/account-requests", protected = false },
        { method    = "POST", path      = "/admin/account-requests/{id}/reject", protected = true }
      ]
    }

    users = {
      invoke_arn    = module.lambda_users.lambda_invoke_arn
      function_name = module.lambda_users.lambda_function_name
      routes = [
        { method = "GET", path = "/users/me", protected = true },
        { method = "PATCH", path = "/users/me", protected = true }
      ]
    }
    companies = {
      invoke_arn    = module.lambda_companies.lambda_invoke_arn
      function_name = module.lambda_companies.lambda_function_name
      routes = [
        { method = "GET", path = "/companies", protected = true },
        { method = "GET", path = "/companies/{id}", protected = true }
      ]
    }
    products = {
      invoke_arn    = module.lambda_products.lambda_invoke_arn
      function_name = module.lambda_products.lambda_function_name
      routes = [
        { method = "GET", path = "/products", protected = true },
        { method = "GET", path = "/products/{id}", protected = true }
      ]
    }
    cart = {
      invoke_arn    = module.lambda_cart.lambda_invoke_arn
      function_name = module.lambda_cart.lambda_function_name
      routes = [
        { method = "GET", path = "/cart/all", protected = true },
        { method = "GET", path = "/cart", protected = true },
        { method = "POST", path = "/cart/items", protected = true },
        { method = "PATCH", path = "/cart/items/{id}", protected = true },
        { method = "DELETE", path = "/cart/items/{id}", protected = true },
        { method = "DELETE", path = "/cart", protected = true }
      ]
    }
    orders = {
      invoke_arn    = module.lambda_orders.lambda_invoke_arn
      function_name = module.lambda_orders.lambda_function_name
      routes = [
        { method = "POST", path = "/orders", protected = true },
        { method = "GET", path = "/orders", protected = true },
        { method = "GET", path = "/orders/{id}", protected = true },
        { method = "PATCH", path = "/orders/{id}/request-cancel", protected = true }
      ]
    }
    admin = {
      invoke_arn    = module.lambda_admin.lambda_invoke_arn
      function_name = module.lambda_admin.lambda_function_name
      routes = [
        { method = "GET", path = "/admin/users", protected = true },
        { method = "POST", path = "/admin/users", protected = true },
        { method = "PATCH", path = "/admin/users/{id}", protected = true },
        { method = "GET", path = "/admin/companies", protected = true },
        { method = "POST", path = "/admin/companies", protected = true },
        { method = "PATCH", path = "/admin/companies/{id}", protected = true },
        { method = "GET", path = "/admin/products", protected = true },
        { method = "POST", path = "/admin/products", protected = true },
        { method = "PATCH", path = "/admin/products/{id}", protected = true },
        { method = "DELETE", path = "/admin/products/{id}", protected = true },
        { method = "GET", path = "/admin/orders", protected = true },
        { method = "GET", path = "/admin/orders/{id}", protected = true },
        { method = "PUT", path = "/admin/orders/{id}", protected = true },
        { method = "GET", path = "/admin/account-requests", protected = true }
      ]
    }
    payments = {
      invoke_arn    = module.lambda_payments.lambda_invoke_arn
      function_name = module.lambda_payments.lambda_function_name

      routes = [
        { method = "POST", path = "/payments", protected = true },
        { method = "GET", path = "/payments", protected = true },
        { method = "GET", path = "/payments/{id}", protected = true }
      ]
    }
    credit_notes = {
      invoke_arn    = module.lambda_credit_notes.lambda_invoke_arn
      function_name = module.lambda_credit_notes.lambda_function_name

      routes = [
        { method = "POST", path = "/notes", protected = true },
        { method = "GET", path = "/notes", protected = true },
        { method = "GET", path = "/notes/{id}", protected = true }
      ]
    }
    commissions = {
      invoke_arn    = module.lambda_commissions.lambda_invoke_arn
      function_name = module.lambda_commissions.lambda_function_name

      routes = [
        { method = "GET", path = "/commissions", protected = true },
        {
          method    = "GET",
          path      = "/commissions/company/{company_id}",
          protected = true
        }
      ]
    }
    invoices = {
      invoke_arn    = module.lambda_invoices.lambda_invoke_arn
      function_name = module.lambda_invoices.lambda_function_name

      routes = [
        { method = "POST", path = "/invoices", protected = true },
        { method = "GET", path = "/invoices", protected = true },
        { method = "GET", path = "/invoices/{id}", protected = true }
      ]
    }
    reports = {
      invoke_arn    = module.lambda_reports.lambda_invoke_arn
      function_name = module.lambda_reports.lambda_function_name

      routes = [
        { method = "GET", path = "/reports/sales", protected = true },
        { method = "GET", path = "/reports/commissions", protected = true },
        { method = "GET", path = "/reports/invoices", protected = true },
        { method = "GET", path = "/reports/dashboard", protected = true },
        { method = "GET", path = "/reports/account-summary", protected = true },
        { method = "GET", path = "/reports/company-summary", protected = true }
      ]
    }
    admin_import_products = {
      invoke_arn    = module.lambda_import_products_start.lambda_invoke_arn
      function_name = module.lambda_import_products_start.lambda_function_name

      routes = [
        { method = "POST", path = "/admin/import-products", protected = true },
        { method = "POST", path = "/admin/import-products/presign", protected = true }
      ]
    }
  }
}

########################################################################
#                             COGNITO
########################################################################

module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment

  app_client_name = "${var.project_name}-${var.environment}-client"

  post_confirmation_lambda_arn  = module.lambda_postconfirmation.lambda_arn
  post_confirmation_lambda_name = module.lambda_postconfirmation.lambda_function_name

  depends_on = [
    module.lambda_postconfirmation
  ]
}


########################################################################
#                               SQS
########################################################################

module "sqs" {
  source = "../../modules/sqs"
}

########################################################################
#                             DATABASE
########################################################################

module "postgresql" {
  source       = "../../modules/postgresql"
  database_url = var.database_url
}

########################################################################
#                            S3 BUCKET
########################################################################

module "s3" {
  source = "../../modules/s3"
  environment  = var.environment
  force_destroy = var.s3_force_destroy
}

########################################################################
#                           Frontend
########################################################################

module "frontend" {
  source = "../../modules/frontend"

  project_name = var.project_name
  environment = var.environment
  force_destroy = var.s3_frontend_destroy
}

