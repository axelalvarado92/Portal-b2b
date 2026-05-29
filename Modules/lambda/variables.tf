variable "function_name" {
    description = "The name of the lambda function"
    type = string
}
variable "handler" {
    description = "The function entrypoint in your code"
    type = string
}

variable "runtime" {
    description = "Lambda Function runtime"
    type = string
    default = "python3.12"
  
}
variable "filename" {
    description = "The path to the function's deployment package within the local filesystem"
    type = string
}
variable "source_code_hash" {
    description = "Used to trigger updates"
    type = string
  
}

variable "memory_size" {
    description = "The amount of memory in MB your Lambda Function is given"
    type = number
}

variable "timeout" {
    description = "A value that controls how long your function will execute before timing out"
    type = number
}

variable "environment_variables" {
    description = "A variable que se pasa a la funcion"
    type = map(string)
    default = {}
}

variable "tags" {
    description = "Tags to assign to the resource"
    type = map(string)
    default = {}
  
}

variable "dynamodb_table_arns" {
    description = "ARNs of DynamoDB tables"
    type = list(string)
    default = []
}

variable "sqs_queue_arns" {
    description = "ARNs of SQS queues"
    type = list(string)
    default = []
  
}
variable "managed_policy_arns" {
    description = "ARNs of managed policies to attach to the role"
    type = list(string)
    default = []
  
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrency for the Lambda function"
  type        = number
  default     = null
}

variable "layers" {
  type    = list(string)
  default = []
}

variable "ses_enabled" {
  description = "Habilita permisos para enviar emails via SES"
  type        = bool
  default     = false
}

variable "s3_bucket_arns" {
  description = "ARNs de buckets S3 a los que la función necesita acceso"
  type        = list(string)
  default     = []
}

variable "lambda_invoke_arns" {
  description = "ARNs of Lambda functions that can invoke this function"
  type        = list(string)
  default     = []
}

variable "cognito_user_pool_arn" {
  type    = string
  default = null
}

variable "enable_cognito_admin" {
  type    = bool
  default = false
}