# Character dictionary seed data

- `ja.json` — JLPT **N5** kanji (~130 entries)
- `zh.json` — **HSK 1** hanzi (~140 entries)

Regenerate from the embedded lists in `backend/scripts/build_character_seeds.py`:

```powershell
cd backend
python scripts/build_character_seeds.py
```

On app startup, new rows are merged into the database (existing characters are skipped).
