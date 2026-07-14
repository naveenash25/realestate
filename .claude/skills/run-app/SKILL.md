---
name: run-app
description: Launch the realestate monorepo (NestJS backend on :8080 + Next.js frontend on :3001) for local dev. Use whenever asked to run, start, or launch the app.
---

# Running this app locally

This is NOT `docker-compose up` — in this dev environment Postgres runs in a
standalone container (not the one docker-compose.yml defines) and the
backend/frontend run directly via `npm run start:dev` / `npm run dev`, not in
containers. Follow the checks below in order; each one is idempotent, so
re-running this skill on an already-running app is safe and cheap.

## 1. Redis (needed by BullMQ)

Check if reachable, start a container only if not:

```powershell
Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded
```

If false and no `realestate-redis` container exists (`docker ps -a`):

```powershell
docker run -d --name realestate-redis -p 6379:6379 redis:7-alpine
```

If the container exists but is stopped: `docker start realestate-redis`.

## 2. Postgres + pgvector + schema

Check for a running postgres container on port 5432 (`docker ps` — in this
environment it's a plain `postgres:16` image, container name `postgres`, NOT
the `pgvector/pgvector:pg15` image docker-compose.yml expects). If nothing is
listening on 5432, start/create one.

`backend/.env` DATABASE_URL is `postgres://postgres:postgres@localhost:5432/realestate`.

Check the `realestate` DB and `vector` extension exist:

```powershell
docker exec postgres psql -U postgres -lqt | Select-String "realestate"
docker exec postgres psql -U postgres -d realestate -c "\dx" | Select-String vector
```

If the DB is missing: `docker exec postgres psql -U postgres -c "CREATE DATABASE realestate;"`

If the `vector` extension isn't installable (`CREATE EXTENSION vector` errors
"extension not available"), the postgres image itself lacks pgvector — install
it in-place (works on the Debian-based `postgres:16` image; container survives
restarts of the exec but re-installs would be needed if the container is
recreated):

```powershell
docker exec postgres bash -c "apt-get update -qq && apt-get install -y -qq postgresql-16-pgvector"
docker exec postgres psql -U postgres -d realestate -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Check whether the schema is already migrated (e.g. does `properties` table exist):

```powershell
docker exec postgres psql -U postgres -d realestate -c "\dt" | Select-String properties
```

If not migrated, apply the raw SQL migration and seed (there is no
`migration:run` npm script despite CLAUDE.md mentioning one — these are plain
`.sql` files applied directly):

```powershell
Get-Content -Raw backend\src\database\migrations\001_initial_schema.sql | docker exec -i postgres psql -U postgres -d realestate
Get-Content -Raw backend\src\database\seeds\001_sample_data.sql | docker exec -i postgres psql -U postgres -d realestate
```

The seed is safe to re-run (`ON CONFLICT DO NOTHING` / `NOT EXISTS` guards) —
if in doubt, just re-run it.

## 3. Start the servers

Both use `run_in_background: true` background PowerShell — do NOT use
`start-dev.ps1` (it opens separate visible PowerShell windows, which you can't
read output from):

```powershell
cd backend; npm run start:dev
```
```powershell
cd frontend; npm run dev -- -p 3001
```

Backend takes ~10-90s to compile+boot ("Nest application successfully started"
/ "Backend running on port 8080" in the log). Frontend is ready in ~2s
("✓ Ready in ...ms").

## 4. Verify

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/properties" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing
```

Both should return 200. `/api/v1/properties` should return `data` with 18
seeded properties (4 cities: Hyderabad, Pune, Jaipur, Coimbatore) once step 2
seeding is done.

## Known schema/code note

`properties.service.ts`'s search query used to reference a nonexistent
`p.cover_image` column (fixed 2026-07-14 to derive it via `LEFT JOIN LATERAL`
against `property_media`, sort_order=0, type='image'). If a fresh `git pull`
ever reintroduces a similar mismatch, check `properties.service.ts` against
the `properties`/`property_media` table definitions in
`001_initial_schema.sql` — the seed and migration files got out of sync with
the service code at some point.
