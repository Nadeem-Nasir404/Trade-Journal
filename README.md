# Trade Journal

Trading journal web app built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI components, Prisma, and PostgreSQL.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn-style components
- Prisma + PostgreSQL

## Features
- `/dashboard` with KPI cards, filters panel, tabs, calendar month view, and day-trades dialog
- `/trades` with table + basic CRUD
- `/journal` and `/ai-chat` placeholders
- Route handlers with Zod validation
- Seed demo data for populated dashboard

## Local Setup
1. Install dependencies
```bash
npm install
```

2. Start PostgreSQL (Docker)
```bash
docker compose up -d
```

3. Run Prisma migration
```bash
npm run db:migrate -- --name init
```

4. Seed demo data
```bash
npm run db:seed
```

5. Start app
```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment
`.env` uses:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trade_journal?schema=public"
```

## API
- `GET /api/trades?symbols=AAPL,TSLA&from=YYYY-MM-DD&to=YYYY-MM-DD&maxTrades=200`
- `POST /api/trades`
- `GET /api/trades/:id`
- `PATCH /api/trades/:id`
- `DELETE /api/trades/:id`
