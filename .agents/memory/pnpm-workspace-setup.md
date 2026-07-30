---
name: pnpm workspace setup
description: What's needed for pnpm to resolve @workspace/* packages and run build scripts in this project
---

# pnpm Workspace Setup

## Rules

1. **`pnpm-workspace.yaml` is required** — pnpm v10 ignores `"workspaces"` in `package.json`. Must have `pnpm-workspace.yaml` listing `artifacts/*`, `lib/*`, `scripts`.

2. **`link-workspace-packages=true` in `.npmrc`** — without this, `@workspace/*` deps with `"*"` version spec are fetched from the npm registry (404). `prefer-workspace-packages=true` alone is not enough in pnpm v10.

3. **`onlyBuiltDependencies` in root `package.json` under `"pnpm"` key** — required for `prisma`, `esbuild`, `@prisma/engines`, `sharp`, `protobufjs`, `unrs-resolver`, `@google/genai` to run their postinstall scripts. Without it, pnpm skips them with a warning.

4. **Next.js dev script must use `${PORT:-3000}`** — the workflow passes `PORT=23007`; hardcoded `-p 3000` causes the workflow to time out.

5. **Prisma client generation** — run from workspace root: `pnpm exec prisma generate --schema=artifacts/calculator-platform/prisma/schema.prisma`

6. **Prisma migrate resolve** — must be run from `artifacts/calculator-platform/` (where `prisma.config.ts` lives), not the workspace root.

**Why:** The project was originally an npm-workspace project imported to a pnpm Replit environment. pnpm has stricter workspace resolution requirements than npm.
