resource "cloudflare_r2_bucket" "r2_bucket" {
  account_id = var.cloudflare_account_id
  name       = "ivan-demo-r2-bucket"
  location   = var.location_hint
}

