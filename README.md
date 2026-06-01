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

## Deploy checklist

Use this flow so recruiters can open the site without running anything locally:

1. Push the latest code to GitHub.
2. Deploy the backend on Render from this repository.
   - Render will read [render.yaml](render.yaml) and create the web service plus PostgreSQL.
   - After the service is live, copy the public backend URL, for example `https://your-backend.onrender.com`.
3. Set these Render environment variables for the backend service:
   - `BASE_URL=https://your-backend.onrender.com`
   - `DATABASE_URL` from the Render PostgreSQL connection string
4. Deploy the frontend on Vercel and point the project root to `frontend/`.
   - Build command: `npm run build`
   - Output directory: `dist`
5. Set this Vercel environment variable for the frontend project:
   - `VITE_API_URL=https://your-backend.onrender.com`
6. Open the Vercel site URL and test:
   - create a short link
   - click the short link and confirm it redirects correctly

If you later add a custom domain, update both `BASE_URL` and `VITE_API_URL` to the new public URLs.


