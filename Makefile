.PHONY: init deploy build

TF_DIR := infra

init:
	terraform -chdir=$(TF_DIR) init

deploy:
	terraform -chdir=$(TF_DIR) apply -var-file=variables.tfvars -auto-approve

build:
	cd workers/w1-post-image && wrangler build && cd ../..