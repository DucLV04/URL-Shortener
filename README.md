# Cloud URL Shortener

Monorepo for a URL shortener service with a React dashboard and an Express backend.

## Stack

- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Storage: PostgreSQL via Prisma, with JSON fallback for local MVP mode

## Quick start

1. Copy `.env.example` to `.env` in both `frontend/` and `backend/`.
2. Install dependencies in each app:
   - `cd frontend && npm install`
   - `cd backend && npm install`
3. If you want PostgreSQL mode locally, set `backend/DATABASE_URL` before generating Prisma client:
   - `cd backend && npm run prisma:generate`
4. Run the backend:
   - `cd backend && npm run dev`
5. Run the frontend:
   - `cd frontend && npm run dev`

## API

- `GET /health`
- `POST /api/shorten`
- `GET /api/urls`
- `GET /:shortCode`

## Local environment

- Backend local fallback works without a database.
- For PostgreSQL, set `DATABASE_URL` in `backend/.env`, then run `npm run prisma:generate` inside `backend/`.
- To sync the Prisma schema into PostgreSQL, run `npm run prisma:push` inside `backend/`.

## Deployment notes

- Frontend is ready for Vercel using [frontend/vercel.json](frontend/vercel.json).
- Backend is ready for Render using [render.yaml](render.yaml).
- Set `VITE_API_URL` on the frontend to the deployed backend URL.
- Set `BASE_URL` on the backend to the deployed backend public URL.
- Set `DATABASE_URL` on Render to the managed PostgreSQL connection string.
- The backend still supports local JSON fallback when `DATABASE_URL` is not set.

## Publish to GitHub

1. Initialize Git in the project root.
2. Create a new empty repository on GitHub.
3. Add the GitHub remote URL and push the first commit.
4. Share the GitHub repo link on your CV or portfolio.

