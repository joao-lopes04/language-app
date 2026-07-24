# Deploying for production

## PostgreSQL on Render (keep user data)

SQLite on Render’s free tier can **reset on redeploy**. For real accounts and vocabulary:

1. Render dashboard → **New → PostgreSQL** (free or paid).
2. Open the new database → **Connect** → copy the **Internal Database URL** (best if the API is on Render in the same region).
3. On your **Web Service** (`language-app`) → **Environment** → add or set:

   ```text
   DATABASE_URL=<paste Internal Database URL>
   ```

   Render sometimes shows `postgres://…`; the app normalizes that automatically.

   **Tip:** In the PostgreSQL service, use **Add to environment** / link to your web service if Render offers it — same effect.

4. **Save** env vars and wait for a **new deploy** (or **Manual Deploy**). On startup, `init_db()` creates tables and seeds kanji.

5. **Fresh database:** Production accounts from old SQLite on Render are **not** migrated automatically. Register again on the live site, or export CSV locally (Profile) and import after you sign in on production.

6. **Local dev** can stay on SQLite (`backend/.env` without `DATABASE_URL`, or `DATABASE_URL=sqlite:///./japanese_study.db`).

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
