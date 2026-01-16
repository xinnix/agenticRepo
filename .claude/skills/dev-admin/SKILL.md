---
name: dev-admin
description: Start React Admin dashboard development server with Vite. Use when user wants to run the admin frontend.
allowed-tools:
  - Bash(pnpm -C :*)
  - Bash(pnpm dev:*)
---

# Admin Development Server

## Overview

Starts the React admin dashboard with Vite in development mode with hot module replacement.

## Location

The admin app is located in `apps/admin/` directory.

## Instructions

Run from project root: `pnpm -C apps/admin dev`

## What it does

- Starts Vite dev server (typically on `http://localhost:5173`)
- Enables Hot Module Replacement (HMR) for instant updates
- Connects to backend API at `http://localhost:3000/trpc`
- Provides TypeScript type checking in development

## Example

```bash
pnpm -C apps/admin dev
```

## Notes

- The API server (`/dev-api`) must be running first for full functionality
- Vite's HMR provides instant feedback without full page reloads
- Environment variables are loaded from `apps/admin/.env`
- The dev server is for development only; use `pnpm build` for production
