resource "cloudflare_r2_bucket" "r2_bucket" {
  account_id = var.cloudflare_account_id
  name       = var.bucket_name
  location   = var.location_hint
}

output "r2_bucket_name" {
  value = cloudflare_r2_bucket.r2_bucket.name
}