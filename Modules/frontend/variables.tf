variable "project_name" {
    description = "The name of the project"
    type = string
  
}

variable "environment" {
    description = "The environment where the resources will be deployed"
    type = string
}

variable "domain_name" {
    description = "The domain name of the application"
    type = string
    default = null
}

variable "certificate_arn" {
    description = "The ARN of the certificate to use for the application"
    type = string
    default = null
    validation {
        condition = var.domain_name == null || var.certificate_arn != null
        error_message = "Si especificás domain_name, también debés especificar certificate_arn."
    }
  
}

variable "force_destroy" {
    description = "Force destroy the bucket"
    type = bool
    default = false
  
}

variable "price_class" {
    description = "The price class of the distribution"
    type = string
    default = "PriceClass_100"
  
}

variable "default_root_object" {
    description = "The object to return when the root path is requested"
    type = string
    default = "index.html"
  
}

variable "spa_routing" {
    description = "Set this to true if you are using single page application routing"
    type = bool
    default = true
}

variable "tags" {
    description = "A map of tags to add to all resources"
    type = map(string)
    default = {}
}

variable "default_ttl" {
    description = "The default TTL for the cache"
    type = number
    default = 3600
    
}

