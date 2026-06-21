variable "aws_region" {
  description = "The AWS region to deploy to"
  default     = "us-east-1"
  type        = string
}

variable "project_name" {
  description = "The name of the project"
  type        = string

}

variable "environment" {
  description = "The environment to deploy to"
  type        = string

}

variable "database_url" {
  description = "The url of the database"
  type        = string

}

variable "ses_sender_email" {
  description = "Email verificado para enviar notificaciones"
  type        = string
}

variable "region" {
  description = "The apigateway region to deploy to"
  type        = string

}

variable "db_host" {
  description = "The database host"
  type        = string
}

variable "db_port" {
  description = "The database port"
  type        = string
}

variable "db_name" {
  description = "The database name"
  type        = string

}

variable "db_user" {
  description = "The database user"
  type        = string

}

variable "db_password" {
  description = "The database password"
  type        = string
  sensitive   = true
}

variable "bootstrap_admin_email" {
  description = "The email of the bootstrap admin user"
  type        = string
}

variable "s3_force_destroy" {
  description = "Whether to force destroy the S3 bucket (deletes all objects)."
  type        = bool
}

variable "cognito_client_id" {
  description = "The Cognito User Pool Client ID for authentication."
  type        = string
}

variable "s3_frontend_destroy" {
  description = "bucket frontend destroy"
  type        = bool
  
}