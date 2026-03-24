variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "location_hint" {
  description = "Optional R2 location hint"
  type        = string
  default     = "WEUR" # Western Europe
}