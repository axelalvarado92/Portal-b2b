output "database_url" {
  description = "The URL of the PostgreSQL database"
  value       = var.database_url
  sensitive   = true
}