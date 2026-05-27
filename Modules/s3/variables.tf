variable "project_name" {
    description = "The name of the project, used for naming resources."
    type        = string
    default     = "portal-b2b"
  
}

variable "environment" {
    description = "The deployment environment (e.g., dev, staging, prod)."
    type        = string
}