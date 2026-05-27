resource "aws_lambda_function" "general_lambda" {
    function_name    = var.function_name
    role             = aws_iam_role.lambda_role.arn
    handler          = var.handler
    runtime          = var.runtime

    filename         = var.filename
    source_code_hash = var.source_code_hash
    memory_size      = var.memory_size
    timeout          = var.timeout

    layers           = var.layers
    
    reserved_concurrent_executions = var.reserved_concurrent_executions
    
    environment {
        variables = var.environment_variables
     
        }
    
  }

  resource "aws_iam_role" "lambda_role" {
  name = "${var.function_name}-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })

  tags = var.tags
}

### Si la lista de ARNs de tablas DynamoDB tiene al menos un elemento, se crea la policy (count = 1).
### Si la lista está vacía, no se crea la policy (count = 0).

data "aws_iam_policy_document" "dynamodb_policy_doc" {
  count = length(var.dynamodb_table_arns) > 0 ? 1 : 0

  statement {
    sid = "DynamoDBTableAccess"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = var.dynamodb_table_arns
  }
}

resource "aws_iam_policy" "dynamodb_policy" {
  count = length(var.dynamodb_table_arns) > 0 ? 1 : 0
  name   = "${var.function_name}-dynamodb-policy"
  policy = data.aws_iam_policy_document.dynamodb_policy_doc[0].json
}

data "aws_iam_policy_document" "sqs_policy_doc" {
  count = length(var.sqs_queue_arns) > 0 ? 1 : 0

  statement {
    sid = "SQSQueueAccess"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility"
    ]
    resources = var.sqs_queue_arns
  }
}

data "aws_iam_policy_document" "ses_policy_doc" {
  count = var.ses_enabled ? 1 : 0

  statement {
    sid = "SESAccess"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "s3_policy_doc" {
  count = length(var.s3_bucket_arns) > 0 ? 1 : 0

  statement {
    sid = "S3BucketAccess"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = [for arn in var.s3_bucket_arns : "${arn}/*"]
  }
  statement {
    sid = "S3BucketlistAccess"

    actions = [
      "s3:ListBucket"
    ]

    resources = var.s3_bucket_arns
  }
}


resource "aws_iam_policy" "s3_policy" {
  count = length(var.s3_bucket_arns) > 0 ? 1 : 0
  name   = "${var.function_name}-s3-policy"
  policy = data.aws_iam_policy_document.s3_policy_doc[0].json
}

resource "aws_iam_policy" "ses_policy" {
  count  = var.ses_enabled ? 1 : 0
  name   = "${var.function_name}-ses-policy"
  policy = data.aws_iam_policy_document.ses_policy_doc[0].json
}

resource "aws_iam_policy" "sqs_policy" {
  count = length(var.sqs_queue_arns) > 0 ? 1 : 0

  name   = "${var.function_name}-sqs-policy"
  policy = data.aws_iam_policy_document.sqs_policy_doc[0].json
}

############### atachments ##################

resource "aws_iam_role_policy_attachment" "ses_attachment" {
  count      = var.ses_enabled ? 1 : 0
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.ses_policy[0].arn
}

resource "aws_iam_role_policy_attachment" "dynamodb_attachment" {
  count      = length(var.dynamodb_table_arns) > 0 ? 1 : 0           
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.dynamodb_policy[0].arn
}

resource "aws_iam_role_policy_attachment" "sqs_attachment" {
  count      = length(var.sqs_queue_arns) > 0 ? 1 : 0
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.sqs_policy[0].arn
}

resource "aws_iam_role_policy_attachment" "s3_attachment" {
  count      = length(var.s3_bucket_arns) > 0 ? 1 : 0
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.s3_policy[0].arn
}

### Por cada ARN de policy administrada que se pase al módulo,
### se crea un attachment independiente al rol.
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  for_each   = toset(var.managed_policy_arns)
  role       = aws_iam_role.lambda_role.name
  policy_arn = each.value
}
