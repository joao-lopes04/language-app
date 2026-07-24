# Product roadmap (items 1–13)

Track progress here. Each phase is shippable on its own (`git push` → Render + Cloudflare).

| # | Feature | Status | Notes |
|---|---------|--------|--------|
| 1 | **Learn Phase B** — JLPT N4 + HSK 2 | Done | Run `build_character_seeds.py` + restart API to merge seeds |
| 2 | **PostgreSQL on Render** | Documented | See [DEPLOY.md](./DEPLOY.md) |
| 3 | **Password change + forgot/reset** | Done | Profile + auth flows; optional dev token |
| 4 | **Learn UX** — pagination, favorites, last viewed | Done | API + localStorage |
| 5 | **Vocabulary CSV import/export** | Done | Profile export/import |
| 6 | **Add to vocabulary from Learn** | Done | Prefill on Words tab |
| 7 | **Deck from JLPT filter** | Done | Learn + Decks; HSK for Chinese |
| 8 | **Review reminders (PWA)** | Done | Profile toggle; browser notifications |
| 9 | **Chinese polish** — HSK filter/labels | Done | Uses `hsk_level` |
| 10 | **Stats — HSK breakdown** | Done | Profile statistics for `zh` |
| 11 | **Dark mode** | Done | Profile toggle |
| 12 | **Custom domain** | Documented | Cloudflare Pages — [DEPLOY.md](./DEPLOY.md) |
| 13 | **Admin user list** | Done | `ADMIN_EMAILS` env, no passwords |

## Suggested order

1. Finish **1, 3, 4, 5, 9, 11, 13** (foundation + safety).
2. Then **6, 7, 10, 8** (study workflow + notifications).
3. **2, 12** when you want production hardening (do PostgreSQL before you rely on cloud data long-term).

## Admin setup (item 13)

On Render, set:

```text
ADMIN_EMAILS=your@gmail.com
```

Use the same email you sign in with. Profile will show an **Admin** section.

## Forgot password without email (item 3)

Production: user requests reset → you can enable SMTP later.

Development: set `EXPOSE_PASSWORD_RESET_TOKEN=true` on backend to return a reset link in the API response (never enable on public Render).
