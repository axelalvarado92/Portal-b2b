variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "region" {
  type = string
}

variable "user_pool" {
  type = string
}

variable "app_client" {
  type = string
}

variable "lambda_integrations" {
  type = map(object({
    invoke_arn    = string
    function_name = string
    routes = list(object({
      method    = string
      path      = string
      protected = bool
    }))
  }))
}

variable "allow_origins" {
  description = "lista de origenes permitidos"
  type = list(string)
  default = ["http://localhost:5173"]
}