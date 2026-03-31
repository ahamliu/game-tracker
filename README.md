# GameShelf

MAL-style game tracker with **library entries**, **custom lists**, **IGDB search** (optional), **user-submitted games**, and **character routes** (status, rating, notes, reference image).

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) or any PostgreSQL 16 connection string

## Setup

1. **Start Postgres** (example with Docker):

   ```bash
   docker compose up -d
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), and optionally `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` for IGDB search.

3. **Install and database**

   ```bash
   npm install
   npm run db:push
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project docs

See `docs/` for PRD decisions, wireframes, technical design, and social phases.

## Scripts

| Script        | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Next.js dev server       |
| `npm run build` | Production build       |
| `npm run db:push` | Apply Drizzle schema to DB |
| `npm run db:studio` | Drizzle Studio         |
