#  Consultancy Management Platform

Production-grade consultancy operations platform for managing the complete student lifecycle: leads, counseling, student registration, applications, documents, finance, attendance, classes, and notifications across multiple branches.

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.6+
- **Backend:** Express, MongoDB Atlas, Mongoose, Redis, BullMQ
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, TanStack Query
- **Storage:** Cloudflare R2 (documents), Cloudinary (profile photos)
- **Email:** Resend
- **Monorepo:** pnpm workspaces + Turborepo
- **Deployment:** Railway (API) + Vercel (Web)

## Prerequisites

- Node.js **>= 20.11.0**
- pnpm **>= 9.12.0**
- Docker + Docker Compose (for local MongoDB/Redis)

## Repository Structure

\`\`\`
japanese-consultancy/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── config/       # Shared config (permissions, constants, statuses)
│   ├── types/        # Shared TypeScript types
│   └── validators/   # Shared Zod schemas
├── docker-compose.yml
├── turbo.json
└── package.json
\`\`\`

## Quick Start

### 1. Install dependencies

\`\`\`bash
pnpm install
\`\`\`

### 2. Start local services (MongoDB + Redis)

\`\`\`bash
pnpm docker:up
\`\`\`

This starts:
- MongoDB → `localhost:27017`
- Redis → `localhost:6379`
- Mongo Express UI → `http://localhost:8081`
- Redis Commander UI → `http://localhost:8082`

### 3. Configure environment variables

\`\`\`bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
\`\`\`

Fill in the required values in each `.env` file.

### 4. Seed the database

\`\`\`bash
pnpm --filter @consultancy/api seed
\`\`\`

This creates:
- All permissions
- All 7 system roles (Super Admin, Admin, Branch Manager, Counselor, Receptionist, Teacher, Student)
- Default branches
- The initial Super Admin user

### 5. Start development

\`\`\`bash
pnpm dev
\`\`\`

- API → `http://localhost:4000`
- Web → `http://localhost:3000`

Or run individually:

\`\`\`bash
pnpm dev:api
pnpm dev:web
\`\`\`

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Run unit + integration tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm format` | Format all files with Prettier |
| `pnpm docker:up` | Start local MongoDB + Redis |
| `pnpm docker:down` | Stop local services |

## Environment

- **Timezone:** `Asia/Kathmandu` (UTC+5:45)
- **Currency:** NPR (Nepali Rupees)
- **Locale:** `en-NP`

## Security

- All permissions enforced server-side. Frontend hiding is UX only.
- HTTP-only session cookies.
- Argon2 password hashing.
- MFA (TOTP, Email OTP, SMS OTP) for privileged users.
- Signed URLs for all private documents.
- Complete audit trail (append-only).

## Documentation

- Architecture docs → `apps/api/docs/`
- API contract → `apps/api/docs/api-contract.md`
- Permissions matrix → `apps/api/docs/permissions.md`
- State machines → `apps/api/docs/state-machines.md`

## License

Proprietary — All rights reserved.