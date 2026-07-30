---
name: Prisma 7 setup quirks
description: Critical differences from Prisma 6 when setting up Prisma 7 in this pnpm monorepo on Replit
---

# Prisma 7 Setup Quirks

## Rule
Prisma 7 breaks from Prisma 6 in several ways — always follow this pattern for this monorepo.

**Why:** Prisma 7 moved database connection config out of `schema.prisma` and into `prisma.config.ts`. Several peer packages also changed.

## How to apply

### 1. schema.prisma — NO `url` in datasource
```prisma
datasource db {
  provider = "postgresql"
  // NO url property here — moved to prisma.config.ts
}
```

### 2. prisma.config.ts — required at workspace root
```ts
import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',  // required for migrate dev
  },
  migrate: {
    adapter: () => new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
});
```

### 3. PrismaClient — must pass adapter
```ts
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

### 4. Package installations required (workspace root, -w flag)
- `prisma` (devDependency)
- `@prisma/client`
- `@prisma/adapter-pg`
- `@prisma/client-runtime-utils` (separate package — NOT auto-installed by @prisma/client)

### 5. onlyBuiltDependencies in root package.json
Add `"@prisma/engines"` and `"prisma"` to the list.

### 6. Drizzle tables still need separate migration
The existing Drizzle `app_state` / `app_state_backups` tables are separate from Prisma tables.
Run `drizzle-kit push` or create tables manually via raw SQL since push requires a TTY.

### 7. Migration command
```bash
npx prisma migrate dev --name init
```
(prisma generate runs automatically before this, but you can run it separately too)
