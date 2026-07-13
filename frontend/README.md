# Talence — Resume Screening Frontend

React (Vite) + Tailwind CSS v4 dashboard for the Smart Resume Screening &
Candidate Ranking backend (Day 1/2 FastAPI). Built against the actual 5
endpoints the backend exposes — nothing here is mocked; every screen calls
a real API or computes from real session data.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if backend isn't on localhost:8000
npm run dev
```

Backend from Day 1/2 must be running for anything to work — this is a real
client, not a demo shell.

## Pages

| Route | What it does |
|---|---|
| `/` | Session overview: stat cards, real ATS score distribution chart, recent candidates |
| `/candidates` | Upload (drag & drop), search, sort, paginate uploaded candidates |
| `/candidates/:id` | Full ATS checklist, skills, contact, education |
| `/jobs` | Create and browse job descriptions |
| `/jobs/:id` | Run ranking, expandable ranked table, multi-select comparison view (up to 3 candidates side by side) |
| `/settings` | Theme, accent color, animation toggle, live API status, keyboard shortcuts, about, clear session data |

## Design System

- **Theme**: full light/dark/system support, dark palette modeled on Vercel/Linear (layered near-blacks, never pure black), persisted and reactive to OS changes
- **Accent**: 5 presets, persisted, applied via CSS custom property override
- **Palette base**: Ink, Canvas, Surface, Border tokens + functional score scale (red→amber→green)
- **Type**: Sora (headings), Inter (body/UI), JetBrains Mono (all scores)
- **Signature element**: `ScoreRing` — animated gradient-stroke circular score, reused everywhere a number is a score
- **Motion**: page-fade transitions, staggered list entrances, sliding active-nav indicator, animated score fills, tap feedback — all respect the Settings > reduced-motion toggle and OS `prefers-reduced-motion`
- Tokens live in `src/index.css` under `@theme` and `.dark` (Tailwind v4 CSS-first config)

## What's real vs. intentionally not built

Every interactive element ships against real data or a real backend call:
global search searches your actual uploaded candidates/JDs, the API status
pill polls your actual `/health` endpoint, Settings' danger zone actually
clears stored session data, the ATS distribution chart is computed from
real uploaded candidates.

**Deliberately not faked:** the notifications bell opens to an honest empty
state (no backend notification system exists yet). No hiring-funnel/
candidate-source analytics — there's no data model behind those yet.

**Known architectural gap:** the backend has no `GET /api/candidates` or
`GET /api/job-descriptions` list endpoints — only single-resource lookups
by id. `AppDataContext` tracks what's been uploaded/created client-side via
`localStorage` as a workaround. This means data doesn't sync across
browsers/devices. Fixing this means adding two read-only list endpoints to
the backend — see conversation history for details.

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import into Vercel, framework preset: **Vite**
3. Set environment variable `VITE_API_BASE_URL` to your deployed backend URL (e.g. Render)
4. Deploy

`vercel.json` is already included with the SPA rewrite rule so client-side
routes like `/candidates/5` don't 404 on a hard refresh.

## Tech Stack

React 19 (Vite), Tailwind CSS v4, React Router DOM, Axios, React Icons
(Lucide set), Framer Motion, React Hot Toast, Recharts (lazy-loaded, only
on the dashboard). Context API for state — no Redux, not needed at this scope.
