# Japanese Study App

Monorepo for a Japanese / Chinese learning app with accounts, per-user data, and mobile-friendly UI.

## Prerequisites

- **Python 3.12+** — runs the API
- **Node.js 20+** (20.19+ recommended for latest Vite) — runs the React app

## Backend (FastAPI)

From the `backend` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API: http://127.0.0.1:8000  
- Interactive docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/api/v1/health  

Copy `backend/.env.example` to `backend/.env` and set a strong `SECRET_KEY` before sharing the app online.

## Frontend (React + Vite)

From the `frontend` folder:

```powershell
npm install
npm run dev
```

- App: http://localhost:5173  
- Requests to `/api/...` are proxied to the backend (see `frontend/vite.config.ts`).

### Accounts

1. Open the app and **Create account** (password at least 8 characters).
2. Each user gets their own words, decks, grammar notes, reviews, and stats.
3. In **Profile**, switch **Japanese** / **Chinese** — data is kept separate per language for the same account.

### Install on your phone (PWA)

After `npm run build`, run `npm run preview` (or host the `dist/` folder). On your phone’s browser, open the site and use **Add to Home Screen** (iOS Safari) or **Install app** (Chrome). For daily use on two phones, deploy the frontend and backend to the internet (below) so you are not tied to your home Wi‑Fi.

## Sharing with family (deploy overview)

You need **HTTPS** and one **shared backend** both phones can reach.

1. **Backend** — e.g. [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io): run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, set `SECRET_KEY`, and `CORS_ORIGINS` to your frontend URL (comma-separated). For more than casual use, use PostgreSQL (`DATABASE_URL`) instead of SQLite.
2. **Frontend** — e.g. Cloudflare Pages, Netlify, or Render static site: build with `VITE_API_URL=https://your-api-host/api/v1 npm run build`, upload `dist/`.
3. Each person creates their own account; your brother can set **Chinese** in Profile.

## Milestone status

- **M1** — Scaffold, Tailwind, shadcn/ui, health check end-to-end
- **M2** — SQLAlchemy + SQLite, `app_meta` table, `GET /api/v1/meta`
- **M3** — Vocabulary CRUD at `/api/v1/words` + UI on the home page
- **M4** — JLPT level per word (`N5`–`N1`) + filter via `GET /api/v1/words?jlpt_level=N5`
- **M5** — Search via `GET /api/v1/words?q=...` (combines with `jlpt_level`)
- **M6** — Read-only kanji at `/api/v1/kanji` (seed data + detail with related words)
- **M7** — Grammar notes CRUD at `/api/v1/grammar-notes` (Markdown content)
- **M8** — Flashcard decks at `/api/v1/decks` + flip-card study UI (no SRS yet)
- **M9** — SRS at `/api/v1/reviews` (due queue + again/good/easy ratings)
- **M10** — Dashboard at `/api/v1/stats/dashboard` (counts, JLPT bars, 7-day reviews, streak)
- **Pre-M11** — JWT auth, per-user + per-language data, mobile app shell, PWA, Chinese study mode
- **M11 (Learn expansion, phase A)** — Bulk N5 + HSK 1 character seeds (`backend/data/kanji/`)
