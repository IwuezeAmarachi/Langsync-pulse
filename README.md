# LangSync Pulse Scaffold

MVP-first monorepo scaffold based on `langsync_pulse_system_architecture.md`.

## Structure

- `apps/web`: Next.js dashboard + API routes (ingestion + health)
- `apps/extension`: Chrome extension (Manifest V3) starter
- `apps/worker`: BullMQ analysis worker starter
- `packages/shared-types`: shared TypeScript contracts
- `packages/analysis-engine`: deterministic mention/scoring/recommendation logic

## Quick start

1. Install dependencies:
   - `npm install`
2. Start web:
   - `npm run dev:web`
3. Start worker (in another terminal):
   - `npm run dev:worker`
4. Load extension:
   - Open `chrome://extensions`
   - Enable Developer mode
   - Load unpacked -> `apps/extension`
5. Type-check extension:
   - `npm run build:extension`

## What is intentionally stubbed

- Auth and workspace checks (Clerk integration)
- DB persistence and Prisma models
- Real queue wiring to Redis
- Full platform extractors beyond ChatGPT starter
