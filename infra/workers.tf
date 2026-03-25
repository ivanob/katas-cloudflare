resource "cloudflare_worker_script" "api" {
  account_id = var.cloudflare_account_id
  name = "w1-post-images"
  content = file("../workers/w1-post-image/dist/index.js")
}

resource "cloudflare_worker_route" "route" {
  zone_id = var.zone_id
  pattern = "api.mydomain.com/*"
  script_name = cloudflare_worker_script.api.name
}