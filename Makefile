.PHONY: init deploy build-workers deploy-workers

TF_DIR := infra

init:
	terraform -chdir=$(TF_DIR) init

deploy:
	terraform -chdir=$(TF_DIR) apply -var-file=variables.tfvars -auto-approve

build-workers:

	cd workers/w1-images && rm -rf ./dist && wrangler build && cd ../..

deploy-workers:
	cd workers/w1-images && wrangler deploy && cd ../..