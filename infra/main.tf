resource "cloudflare_r2_bucket" "r2_bucket" {
  account_id = var.cloudflare_account_id
  name       = "r2-images-bucket"
  location   = var.location_hint
}

resource "cloudflare_d1_database" "d1_database" {
  account_id = var.cloudflare_account_id
  name       = "images"
}

