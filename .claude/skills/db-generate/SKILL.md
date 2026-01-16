---
name: db-generate
description: Generate Prisma client from database schema. Use after schema changes or when Prisma client is out of sync.
allowed-tools:
  - Bash(npx prisma generate:*)
  - Bash(cd :*)
---

# Generate Prisma Client

## Overview

Regenerates the Prisma client based on the current schema. This is necessary after:
- Modifying `schema.prisma`
- Running migrations
- Cloning the repository (first time setup)

## Location

Run from `packages/database/` directory.

## Instructions

1. Navigate to database package: `cd packages/database`
2. Run: `npx prisma generate`

## Example

```bash
cd packages/database
npx prisma generate
```

## Output

The Prisma client is generated to `packages/database/generated/` and is available as `@opencode/database` package.

## Notes

- The generated client includes TypeScript types for all models
- This command does not modify the database, only the client code
- If types are not updating in IDE, try restarting TypeScript server
