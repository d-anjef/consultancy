# Contributing Guide

Thank you for contributing to the Japanese Consultancy Management Platform.

## Development Workflow

1. **Create a feature branch** from `main`:
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

2. **Make changes** following our architecture and coding standards.

3. **Run checks locally** before pushing:
   \`\`\`bash
   pnpm typecheck
   pnpm lint
   pnpm test
   \`\`\`

4. **Commit** using conventional commits:
   \`\`\`
   feat(auth): add MFA setup flow
   fix(documents): correct verification permission check
   docs(api): update endpoint list
   test(users): add invitation flow tests
   \`\`\`

5. **Open a Pull Request** to `main`.

6. **CI must pass** and at least one reviewer must approve.

## Code Standards

### Architecture

- Follow the module structure: `model → repository → service → controller → routes`
- Business logic lives in **services**, never in controllers or components
- All API input validated with **Zod** at the boundary
- All permissions checked **server-side** — frontend hiding is UX only
- Branch-scoped data must be enforced by `branchGuard` middleware

### TypeScript

- `strict: true` — no `any` unless justified
- Prefer `interface` for public contracts, `type` for unions/utilities
- Explicit return types on exported functions

### Testing

- Unit tests for services and utilities
- Integration tests for API routes
- E2E tests (Playwright) for critical user flows

### Security

- Never commit secrets — use `.env` and `.env.example`
- Never trust client-provided role or branch values
- All financial mutations require audit log entries
- All document access requires signed URLs

## Definition of Done

A feature is complete when it has:

- [ ] Database model with proper indexes
- [ ] Zod validation at API boundary
- [ ] Authorization middleware applied
- [ ] Business logic in service layer
- [ ] Audit log entries for sensitive actions
- [ ] Notification events triggered where applicable
- [ ] Unit + integration tests
- [ ] Frontend integration with loading/empty/error states
- [ ] Documentation updated

## Branch Naming

- `feature/short-description`
- `fix/short-description`
- `refactor/short-description`
- `docs/short-description`
- `test/short-description`

## Questions

Open an issue or reach out to the project lead.