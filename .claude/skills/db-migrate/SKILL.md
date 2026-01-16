---
name: db-migrate
description: Create and apply a new Prisma migration for database schema changes. Use when user wants to modify database schema, add tables, or alter existing structures.
allowed-tools:
  - Bash(npx prisma migrate dev:*)
  - Bash(cd :*)
---

# Database Migration

## Overview

Creates and applies a new Prisma migration to update the database schema. This command:
1. Generates a new migration file based on schema changes
2. Applies the migration to the database
3. Updates the Prisma client

## Location

All migrations are run from `packages/database/` directory.

## Instructions

When a user requests a database migration:

1. Navigate to the database package: `cd packages/database`
2. Run migration with a descriptive name: `npx prisma migrate dev --name <migration-name>`
3. The migration name should describe the change (e.g., `add-user-timestamps`, `create-posts-table`)

## Migration Name Convention

Use lowercase, hyphen-separated names that describe the schema change:
- `add-user-timestamps`
- `create-posts-table`
- `add-index-on-email`
- `rename-status-column`

## Example

```bash
cd packages/database
npx prisma migrate dev --name add-user-timestamps
```

## Notes

- This command also regenerates the Prisma client automatically
- If database schema and Prisma schema are out of sync, user may need to reset the database
- Migration files are created in `packages/database/prisma/migrations/`
