# Deploying for production

## PostgreSQL on Render (keep user data)

SQLite on Render’s free tier can **reset on redeploy**. For real accounts and vocabulary:

1. Render dashboard → **New → PostgreSQL** (free or paid).
2. Copy the **Internal Database URL** (or External if required).
3. On your **Web Service** → **Environment** → add:

   ```text
   DATABASE_URL=postgresql://user:pass@host/dbname
   ```

   SQLAlchemy accepts this URL as-is (`app/core/config.py`).

4. **Manual Deploy** the backend. Tables are created on startup via `init_db()`.

5. **Note:** This starts a **fresh** database. Export CSV from the old app first if you need to migrate words (import in Profile when available).

## Custom domain (Cloudflare Pages)

1. Cloudflare Pages → your project → **Custom domains** → add e.g. `study.example.com`.
2. Follow DNS instructions (usually CNAME to `*.pages.dev`).
3. Update **Render** `CORS_ORIGINS` to include `https://study.example.com`.
4. Users can keep the same `*.pages.dev` link or re-add home screen after the custom domain works.

## Environment checklist

| Variable | Where | Purpose |
|----------|--------|---------|
| `SECRET_KEY` | Render | JWT signing |
| `CORS_ORIGINS` | Render | Frontend URL(s) |
| `DATABASE_URL` | Render | PostgreSQL (optional) |
| `ADMIN_EMAILS` | Render | Comma-separated admin emails |
| `VITE_API_URL` | Cloudflare | `https://your-api.onrender.com/api/v1` |
