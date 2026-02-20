SHELL := /bin/bash

.PHONY: up down logs ps build api-health api-ping psql deploy-prod rollback-prod

# DEV (local)
up:
	cd infra && docker compose up -d --build

down:
	cd infra && docker compose down

logs:
	cd infra && docker compose logs -f --tail=100

ps:
	cd infra && docker compose ps

build:
	cd infra && docker compose build

api-health:
	curl -sS http://127.0.0.1:8080/api/health ; echo

api-ping:
	curl -sS http://127.0.0.1:8080/api/db/ping ; echo

psql:
	cd infra && docker compose exec db psql -U familyops -d familyops

# PROD trigger (no SSH deploy; triggers GH workflow which updates :stable)
deploy-prod:
	gh workflow run build.yml

# PROD rollback (retag :stable -> sha-<SHA>)
rollback-prod:
	@test -n "$(SHA)" || (echo "Usage: make rollback-prod SHA=<commitsha>"; exit 1)
	gh workflow run rollback.yml -f sha=$(SHA)
