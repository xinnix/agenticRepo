---
name: dev-api
description: Start NestJS API development server with hot reload. Use when user wants to run the backend API server.
allowed-tools:
  - Bash(pnpm -C :*)
  - Bash(pnpm dev:*)
---

# API Development Server

## Overview

Starts the NestJS backend API server in development mode with hot reload enabled.

## Location

The API server is located in `apps/api/` directory.

## Instructions

Run from project root: `pnpm -C apps/api dev`

## What it does

- Starts NestJS server on `http://localhost:3000`
- Enables hot reload for rapid development
- Serves tRPC router at `/trpc` endpoint
- Watches for file changes and automatically restarts

## Example

```bash
pnpm -C apps/api dev
```

## Notes

- Make sure `DATABASE_URL` is configured in `packages/database/.env`
- Run migrations before starting: `/db-migrate init`
- The API server must be running for the admin frontend to work
- Default port is 3000, can be changed via environment variable
