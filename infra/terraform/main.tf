# SERCOP V2 – Terraform base (ejemplo genérico)
# Adaptar al proveedor: GCP (google provider), AWS (aws provider), Azure (azurerm provider).

terraform {
  required_version = ">= 1.0"
  # backend "gcs" { bucket = "sercop-tfstate" prefix = "terraform/state" }  # opcional
}

# Ejemplo: descomentar y configurar según el proveedor elegido.
# variable "project_id" { type = string description = "GCP project ID" }
# variable "region"     { type = string default = "us-east1" }

# resource "google_container_cluster" "primary" {
#   name     = "sercop-cluster"
#   location = var.region
#   ...
# }

# output "cluster_endpoint" { value = google_container_cluster.primary.endpoint }
