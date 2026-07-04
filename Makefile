SHELL := /bin/bash

.PHONY: up down logs ps build api-health api-ping psql dev-seed \
        macmini-up macmini-down macmini-logs macmini-ps migrate-supabase \
        deploy rollback

# Feste Compose-Projektnamen trennen DEV und PROD auf derselben Maschine sauber:
# eigene Container, Netze und Volumes je Projekt.
DEV  := docker compose -p familyops-dev --env-file .env.dev
PROD := docker compose -p infra -f docker-compose.macmini.yml

# =====================================================================
# DEV / TEST  (lokal, http://127.0.0.1:8080, eigene DB, AUTO_MIGRATE=1)
# =====================================================================
up:
	cd infra && $(DEV) up -d --build

down:
	cd infra && $(DEV) down

logs:
	cd infra && $(DEV) logs -f --tail=100

ps:
	cd infra && $(DEV) ps

build:
	cd infra && $(DEV) build

psql:
	cd infra && $(DEV) exec db psql -U familyops -d familyops

# DEV-DB mit dem neuesten PROD-Backup befüllen (realistische Testdaten)
dev-seed:
	./scripts/seed-dev-from-backup.sh

api-health:
	curl -sS -u "$${BASIC_AUTH_USER:-dennis}:$${BASIC_AUTH_PASS:-dev-local-password}" http://127.0.0.1:8080/api/health ; echo

api-ping:
	curl -sS -u "$${BASIC_AUTH_USER:-dennis}:$${BASIC_AUTH_PASS:-dev-local-password}" http://127.0.0.1:8080/api/db/ping ; echo

# =====================================================================
# PROD  (live, 80/443 + TLS, Domain, DB-Volume infra_pgdata_macmini)
# Nur im PROD-Worktree (~/prod/brinkhorst-family-ops) ausführen!
# =====================================================================
macmini-up:
	cd infra && $(PROD) up -d --build

macmini-down:
	cd infra && $(PROD) down

macmini-logs:
	cd infra && $(PROD) logs -f --tail=100

macmini-ps:
	cd infra && $(PROD) ps

migrate-supabase:
	./scripts/migrate-from-supabase.sh

# Deploy: aktuellen Prod-Branch ziehen und Stack neu bauen (im PROD-Worktree)
deploy:
	git pull --ff-only
	cd infra && $(PROD) up -d --build
	@echo "Deploy fertig. Status: make macmini-ps"

# Rollback auf einen früheren Commit (im PROD-Worktree): make rollback SHA=<sha>
rollback:
	@test -n "$(SHA)" || (echo "Usage: make rollback SHA=<commitsha>"; exit 1)
	git checkout $(SHA)
	cd infra && $(PROD) up -d --build
	@echo "Rollback auf $(SHA) fertig."
