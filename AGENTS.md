# Environment
- `AUTH_URL` must be set to `http://localhost:3000` in `.env` (NextAuth UntrustedHost fix)
- `WATCHPACK_POLLING=true` required in `dev` script (avoids EMFILE on macOS with 128K node_modules files)

# Commands

## Development
- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `./deploy.sh` — One-command Docker deploy

## Testing
- `npm test` — Run API/unit tests (vitest)
- `npm run test:watch` — Watch mode
- `npm run test:coverage` — With coverage
- `npm run test:components` — Component tests (jsdom)
- `npm run test:all` — Both API + component tests
- `npm run test:e2e` — Playwright E2E tests
- `npm run test:e2e:ui` — Playwright UI mode

## Linting & TypeScript
- `npm run lint` — ESLint
- `npm run typecheck` — tsc --noEmit

## Audit
- `npm run audit` — Full audit
- `npm run audit:security` — Security-only audit
- `npm run audit:critical` — Fail on critical issues

## Database
- `npx prisma migrate deploy` — Apply migrations
- `npx prisma studio` — Prisma Studio UI
- `npx prisma generate` — Regenerate client

## Docker
- `make docker:prod` — Build and start production stack
- `docker compose up -d --build` — Full stack
- `docker compose down -v` — Reset (deletes volumes)
