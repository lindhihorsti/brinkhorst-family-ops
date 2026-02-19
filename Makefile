SHELL := /bin/bash

.PHONY: up down logs ps build up-prod down-prod logs-prod ps-prod api-health api-ping psql

# DEV (default)
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

# PROD (overlay)
up-prod:
	cd infra && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
down-prod:
	cd infra && docker compose -f docker-compose.yml -f docker-compose.prod.yml down
logs-prod:
	cd infra && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100
ps-prod:
	cd infra && docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
