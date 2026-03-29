output "r2_bucket_name" {
  value = cloudflare_r2_bucket.r2_bucket.name
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.images_kv.id
}