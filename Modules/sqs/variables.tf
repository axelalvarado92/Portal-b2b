variable "environment" {
    description = "The environment to deploy to"
    type = string
    default = "dev"
}

variable "queue_name" {
    description = "The name of the ecommerce queue"
    type = string
    default = "ecommerce-queue"
  
}

variable "project_name" {
    description = "The name of the project"
    type = string
    default = "ecommerce"
  
}
variable "deadletter_name" {
    description = "The name of the deadletter queue"
    type = string
    default = "ecommerce-deadletter"
  
}


