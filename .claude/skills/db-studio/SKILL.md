---
name: db-studio
description: Open Prisma Studio GUI to view and edit database data. Use when user wants to browse database records or manually inspect data.
allowed-tools:
  - Bash(npx prisma studio:*)
  - Bash(cd :*)
---

# Prisma Studio

## Overview

Opens Prisma Studio, a visual database explorer that allows you to:
- View all database records
- Add, edit, and delete data
- Filter and search records
- Explore relationships between tables

## Location

Run from `packages/database/` directory.

## Instructions

1. Navigate to database package: `cd packages/database`
2. Run: `npx prisma studio`

## Example

```bash
cd packages/database
npx prisma studio
```

## Access

Once started, Prisma Studio opens in your browser at:
- Default URL: `http://localhost:5555`

## Notes

- Prisma Studio reads directly from the database configured in `DATABASE_URL`
- Changes made in Studio are immediately persisted to the database
- Keep the terminal window open to maintain the Studio server
- Press Ctrl+C in the terminal to stop Studio
