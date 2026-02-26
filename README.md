# ⬡ EagleEye — Assembly Tracking App

Single-file app with Supabase Auth (Google OAuth) + RLS security.

## Quick Start

1. Copy `config.template.js` → `config.js`
2. Fill in your Supabase URL + anon key
3. Open `index.html` in browser (or deploy to GitHub Pages)

## Files

| File | Purpose |
|---|---|
| `index.html` | Complete app — all pages, auth, DB queries |
| `config.js` | Your Supabase keys (gitignored) |
| `config.template.js` | Template for config.js |
| `.gitignore` | Keeps config.js out of git |

## Features

- **Login**: Google OAuth via Supabase
- **Home Page**: Assembly grid, quick nav cards
- **Unit Selection**: Filter/search/multi-select units
- **Assembly View**: Tree display, ECN banner, cascade detection, apply/undo changes, upgrade button
- **Tree Editor**: Admin-only, version pills, read-only tree view
- **Roles**: admin (full), operator (apply ECN + upgrade), viewer (read only)

## Supabase Tables Used

All prefixed `eagle_eye_app_`:
- assemblies, version_history, groups, steps, step_links, fasteners
- ecn_change_records, ecn_applications, production_units
- `master_parts_list_all` (shared, no prefix)
- `authentication_mode_user_roles` + `authentication_mode_audit_log`

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "EagleEye app"
git remote add origin YOUR_REPO_URL
git push -u origin main
# Enable Pages in repo settings → Source: main branch
```
