variable "project_name" {
    description = "The name of the project, used for naming resources."
    type        = string
    default     = "portal-b2b"
  
}

variable "environment" {
    description = "The deployment environment (e.g., dev, staging, prod)."
    type        = string
}

variable "force_destroy" {
    description = "Whether to force destroy the S3 bucket (deletes all objects)."
    type        = bool
    default     = false
}

variable "bucket_name" {
    description = "The name of the S3 bucket."
    type        = string
  
}

variable "block_public_acls" {
    description = "Whether to block public ACLs for the S3 bucket."
    type        = bool

  
}

variable "block_public_policy" {
    description = "Whether to block public policies for the S3 bucket."
    type        = bool

  
}

variable "ignore_public_acls" {
    description = "Whether to ignore public ACLs for the S3 bucket."
    type        = bool

  
}

variable "restrict_public_buckets" {
    description = "Whether to restrict public buckets for the S3 bucket."
    type        = bool

  
}

variable "bucket_purpose" {
    description = "The purpose of the S3 bucket (e.g., logs, assets, backups)."
    type        = string
    default = "uploads"
  
}