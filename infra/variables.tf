variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "bucket_name" {
  description = "R2 bucket name"
  type        = string
  default     = "ivan-demo-r2-bucket"
}

variable "location_hint" {
  description = "Optional R2 location hint"
  type        = string
  default     = "WEUR"
}