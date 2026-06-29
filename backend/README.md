# OwnerConnect — Backend

NestJS API for the OwnerConnect real estate platform. Runs on port 8080.

## Dev setup

Copy env file:
```bash
cp .env.example .env
```

Install dependencies (first time only):
```bash
npm install
```

Run DB migrations:
```bash
npm run migration:run
```

## Run

**Backend only:**
```bash
npm run start:dev
```

**Both frontend + backend together (from repo root, Windows):**
```powershell
.\start-dev.ps1
```

Backend API → http://localhost:8080/api/v1/  
Frontend → http://localhost:3001

> First start takes ~90 seconds for TypeScript compilation.

## Other commands

```bash
npm run build          # compile TypeScript
npm run test           # Jest unit tests
npm run test:e2e       # end-to-end tests
npm run lint           # ESLint

npm run migration:run      # apply pending migrations
npm run migration:revert   # revert last migration
npm run migration:generate # generate from entity changes
```
