# ⬡ EagleEye v2

Assembly version tracking & ECN management platform for robot manufacturing.

## Features

- **Multi-assembly support** — Head & Body, Arm, Gripper, Base Unit
- **Unit tracking** — Per serial number version tracking with ECN diff view
- **Cascade engine** — Disassembly cascade logic with chain-based dependency
- **Role system** — Admin (drag reorder + mark applied), Operator (mark applied), Viewer (read-only)
- **Part disposition** — Scrap / Reuse / Rework tags on ECN-changed parts
- **3 view tabs** — List View (active), Graph (placeholder), Kanban (placeholder)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## GitHub Pages Setup

1. Create a new repo named `eagle-eye-v2`
2. Update `base` in `vite.config.js` if your repo name is different
3. Push your code
4. Run `npm run deploy`
5. In repo Settings → Pages → set source to `gh-pages` branch

## Supabase Integration

1. Copy `.env.example` to `.env`
2. Add your Supabase URL and anon key
3. Uncomment the Supabase queries in `src/data/supabase.js`
4. Replace mock data imports with async fetch calls

## Project Structure

```
src/
├── App.jsx                    # Main app with routing & role switcher
├── main.jsx                   # React entry point
├── theme.js                   # Dark/light theme tokens
├── components/
│   ├── TabBar.jsx             # List/Graph/Kanban tab bar
│   ├── ListTab.jsx            # Assembly tree with ECN & cascade
│   ├── ChangeModal.jsx        # ECN change detail modal
│   ├── GraphPlaceholder.jsx   # Graph view placeholder
│   └── KanbanPlaceholder.jsx  # Kanban view placeholder
├── pages/
│   ├── HomePage.jsx           # Assembly type selection
│   ├── UnitSelectionPage.jsx  # Serial number grid
│   ├── AssemblyViewPage.jsx   # Main view with tabs
│   └── TreeEditorPage.jsx     # Admin tree editor (placeholder)
├── data/
│   ├── constants.js           # Roles, dispositions, assembly types
│   ├── cascadeEngine.js       # Chain detection & cascade logic
│   ├── mockData.js            # Mock data (replace with Supabase)
│   └── supabase.js            # Supabase client & data functions
└── styles/
    └── global.css             # Global styles & animations
```

## Database

Uses Supabase database `Eagle_eye_`. Schema files:
- `01_core_migration.sql` — Core tables
- `ecn_change_tracking_addon.sql` — ECN system tables

Shared table: `master_parts_list_all` (cross-app, auto-resolves part names from P/N)
