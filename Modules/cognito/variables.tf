variable "project_name" {
    description = "The name of the project"
    type = string
    default = "ecommerce"
  
}

variable "environment" {
    description = "The environment to deploy to"
    type = string
    default = "dev"
  
}

variable "app_client_name" {
    description = "The app client for the cognito user pool"
    type = string
    default = null
  
}

variable "post_confirmation_lambda_arn" {
  description = "ARN de la lambda que se ejecuta al confirmar un usuario"
  type        = string
  default     = null
}

variable "post_confirmation_lambda_name" {
  description = "The name of the post confirmation lambda function"
  type        = string
  default     = null
}