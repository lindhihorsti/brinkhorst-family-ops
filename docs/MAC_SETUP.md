# Mac Setup (Docker Desktop)

Dieses Setup spiegelt die lokale Ubuntu-Dev-Umgebung auf macOS und lässt CI/CD unverändert.

## Voraussetzungen

- Homebrew installiert
- Docker Desktop installiert und gestartet
- Git installiert

Prüfen:

```bash
docker version
docker compose version
```

## Docker Context

Sicherstellen, dass Docker Desktop aktiv ist:

```bash
docker context use desktop-linux
docker context ls
```

Falls Colima läuft, stoppen:

```bash
colima stop
```

## Lokale ENV vorbereiten

Im Repo-Root:

```bash
cp infra/.env.example infra/.env
```

`DENNIS_PWHASH` erzeugen (Basic Auth für Caddy):

```bash
docker run --rm caddy:2 caddy hash-password --plaintext 'DEIN_PASSWORT'
```

Den erzeugten Hash in `infra/.env` eintragen:

```env
DENNIS_PWHASH='...hash...'
```

OpenAI-Konfiguration (lokal):

```env
OPENAI_API_KEY=sk-...
# Rezepte-Import + Shop-Formatierung
OPENAI_MODEL=gpt-4o-mini
# "Was machen wir heute?" (Ideen-Generator)
OPENAI_MODEL_ACTIVITIES=gpt-5.2
```

## Start / Stop

```bash
make up
make ps
make logs
make down
```

## API Smoke Tests (mit Basic Auth)

Standardmäßig verwenden die Make-Targets:

- User: `dennis`
- Passwort: `dev-local-password`

Bei eigenem Passwort einfach ENV setzen:

```bash
BASIC_AUTH_USER=dennis BASIC_AUTH_PASS='DEIN_PASSWORT' make api-health
BASIC_AUTH_USER=dennis BASIC_AUTH_PASS='DEIN_PASSWORT' make api-ping
```

Direkt mit curl:

```bash
curl -u dennis:DEIN_PASSWORT http://127.0.0.1:8080/api/health
curl -u dennis:DEIN_PASSWORT http://127.0.0.1:8080/api/db/ping
```

## Troubleshooting

### `401 Unauthorized` bei `/api/*`
Basic Auth ist aktiv. Nutze `-u user:pass` oder die Make-Targets mit `BASIC_AUTH_PASS`.

### Caddy startet nicht (`username and password cannot be empty`)
`DENNIS_PWHASH` fehlt oder ist leer in `infra/.env`.

### Falscher Docker Daemon
Prüfen, ob der Context auf `desktop-linux` steht:

```bash
docker context ls
```
