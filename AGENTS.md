# rhess

RHESS - Enterprise Skills Server — self-hosted AI agent skills directory.

## Build & Test Commands

- Dev (full stack): `npm run dev`
- Dev (server only): `npm run dev:server`
- Dev (UI only): `npm run dev:ui`
- Build: `npm run build`
- Test all: `npm test`
- Test watch: `npm run test:watch`
- Lint all: `npm run lint`
- Lint single file: `npx eslint src/server/routes/skills.ts`
- Type check all: `npx tsc --noEmit`
- Type check server: `npx tsc --project tsconfig.server.json --noEmit`

## Key Conventions

- **Openspec for feature work:** Most feature work is done through the Openspec workflow (see `.claude/skills/` for skills). Small, isolated changes can be made directly, but any significant feature should go through Openspec.
- **Backend takes priority over frontend on naming/output:** When UI changes conflict with backend APIs on naming or output shape, defer to the backend. Only update the backend if there is a genuine functional gap — not just a naming difference.

## PR Workflow

1. Branch off `main`, commit, and push to the `origin` fork remote (not `upstream`).
2. Open the PR against `upstream` (`redhat-ai-dev/rhess`) with `gh pr create`.
3. Wait for CI. Check what's actually required with `gh api repos/redhat-ai-dev/rhess/branches/main/protection` rather than assuming:
   - **Required for merge:** GitHub Actions `Build, Lint & Test` + container image build, and Prow `ci/prow/images`.
   - **Recommended to watch, but not merge-blocking:** `ci/prow/rhess-e2e` is `optional: true` (deploys to a live OpenShift cluster and can take a long time) — treat it as a smoke test, not a gate.
   - When polling via `gh pr view --json statusCheckRollup`, note GitHub Actions entries are `CheckRun`s (`status`/`conclusion` fields) while Prow entries are `StatusContext`s (`state` field only) — a query that only checks `conclusion`/`status` will silently miss Prow results.
4. Wait for the Qodo automated review to post — it auto-triggers on PR open, no manual step needed. Treat each finding on its merits — fix real bugs, but don't blindly apply suggestions that don't hold up.
5. Push fixes (amend if the PR is a single logical commit and hasn't been reviewed by a human yet; otherwise add a new commit) and re-verify CI + tests. This repo has no `.pr_agent.toml`, so Qodo's `handle_push_trigger` default (`false`) applies — it will **not** auto-re-review on subsequent pushes, including amends/force-pushes. Comment `/agentic_review` (not the deprecated `/review`) to manually request the re-review.
6. Confirm Qodo has no further unresolved findings and required checks are green, then merge (squash) and delete the branch.

## Architecture

- **src/server/** — Fastify API server (routes, plugins, ingestion, search, db)
- **src/ui/** — React + PatternFly frontend (pages, components, hooks, api, utils)
- **Database:** SQLite via `better-sqlite3`. While the project is in prototype phase, do not add database migrations — pin to the v1 schema only.
- **UX mockups:** When adopting new UI changes, refer to the UX source at `https://gitlab.cee.redhat.com/ttobias/RHESS` for mockups.
- **Design intent & invariants:** See [docs/design/architecture.md](docs/design/architecture.md) for key invariants, preconditions, and a link to the full Openspec design document.

## Commit Conventions

- Follow the Conventional Commits format: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, etc. Enforced via commitlint.
- Agent-assisted commits should include an `Assisted-by: <model>` footer.
