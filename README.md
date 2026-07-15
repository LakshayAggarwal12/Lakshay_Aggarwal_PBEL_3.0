# HireSense — AI-Powered Resume Screening & Candidate Ranking

**Live app:** [https://hiresense-sepia.vercel.app](https://hiresense-sepia.vercel.app)

> **Note:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take **30–60 seconds** due to cold starts. Subsequent requests will be significantly faster.

HireSense parses resumes, scores them for ATS (Applicant Tracking System) parseability, and ranks candidates against a job description using a weighted combination of content similarity and exact skill matching — all backed by a real, queryable skills taxonomy dataset rather than hardcoded logic.

---
 
## Screenshots
 
| Dashboard Overview | Candidate Ranking |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Ranking](docs/screenshots/ranking.png) |
 
| ATS Score Breakdown | Candidates List |
|---|---|
| ![ATS Report](docs/screenshots/ats-report.png) | ![Candidates](docs/screenshots/candidates.png) |
 
| Job Description & Skills | Dark Mode |
|---|---|
| ![Job Description](docs/screenshots/job-description.png) | ![Settings](docs/screenshots/settings.png) |

---

## 🎥 Demo Video

[Watch the demo](docs/Demo-Video/HireSense-video.mp4)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Data Flow](#architecture--data-flow)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Known Limitations & Future Work](#known-limitations--future-work)
- [Author](#author)

---

## Overview

Recruiters and hiring pipelines waste time manually screening resumes that never had a chance of passing an ATS in the first place, and manually cross-referencing skills against every job description. HireSense automates both problems:

1. **Upload a resume** (PDF/DOCX) → get instant, explainable ATS parseability feedback plus extracted structured data (skills, contact info, education, experience).
2. **Submit a job description** → the system extracts its required skills and detects which professional field it belongs to (Backend, Data Science, DevOps, etc.).
3. **Rank candidates against that JD** → every uploaded candidate is scored on content similarity and exact skill overlap, with a transparent breakdown of what matched and what's missing — not a black-box number.

Every score the app produces is **explainable by design** — rule-based checks, weighted formulas, and a real skills database, not an opaque model output.

---

## Features

### Resume Intelligence
- PDF and DOCX parsing with layout analysis (detects multi-column layouts, embedded images, non-ASCII noise)
- Structured extraction: name, email, phone, education, experience years, skills
- **ATS Parseability Score** — 7 independent, weighted, explainable checks (text extractability, section headers, layout, contact info, images, special characters, length), each with a pass/fail reason and improvement suggestion

### Job Description Intelligence
- Automatic required-skill extraction from free-text job descriptions
- **Field detection** — guesses which professional field a JD (or candidate) belongs to, using weighted skill-to-field relevance from the skills dataset

### Candidate Ranking
- **Composite ranking score** combining:
  - Content similarity (TF-IDF + cosine similarity)
  - Exact skill overlap against the JD's required skills
- Full transparency per candidate: matched skills, missing skills, and targeted improvement suggestions
- Multi-candidate **comparison view** — select up to 3 candidates and compare side by side

### Skills Dataset
- 88 skills across 10 categories, with alias normalization (e.g. "ReactJS" / "React.js" → canonical "React")
- 8 job fields with weighted skill relevance, extensible via API without redeploying
- Self-seeding on first boot — no manual database setup step required

### Dashboard & UX
- Real-time stats and ATS score distribution chart, computed from actual uploaded data
- Global search, sortable/paginated candidate list
- Full light/dark/system theme support with persisted accent color
- Responsive: collapsible sidebar on desktop, drawer navigation on mobile
- Live backend health indicator

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 (Vite) |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM |
| Animation | Framer Motion |
| Charts | Recharts (lazy-loaded) |
| HTTP client | Axios |
| Backend framework | FastAPI (Python) |
| ORM / Database | SQLAlchemy + PostgreSQL |
| Document parsing | pdfplumber, python-docx |
| NLP — skill extraction | spaCy (PhraseMatcher) |
| NLP — similarity matching | scikit-learn (TF-IDF + cosine similarity) |
| Deployment | Render (backend + Postgres), Vercel (frontend) |

> **Note on the matching engine:** an earlier version used `sentence-transformers` (transformer embeddings) for semantic similarity. This was deliberately replaced with TF-IDF to fit within free-tier hosting memory limits (transformer models + PyTorch require 400–600MB+ RAM, exceeding Render's 512MB free tier). This is a documented accuracy/cost tradeoff, not an oversight — see `backend/app/nlp/matcher.py` for the full reasoning and upgrade path.

---

## Architecture & Data Flow

```mermaid
flowchart TD
    A[Client - React/Vite] -->|HTTP/JSON| B[FastAPI Backend]
    B --> C[Parser Layer<br/>pdfplumber / python-docx]
    B --> D[NLP Layer<br/>spaCy skill extraction<br/>TF-IDF similarity<br/>ATS rule checks]
    B --> E[(PostgreSQL)]
    D --> E
    C --> D
    E -->|skills, categories, fields| D

    subgraph Skills Dataset
        E
    end
```

**Resume upload flow:**
1. Client sends a PDF/DOCX to `POST /api/upload-resume`
2. File type & size validated
3. Parsed into plain text + layout metadata (columns, images, page count)
4. NLP extraction pulls skills (matched against the database-backed taxonomy), contact info, education, experience
5. ATS checker runs 7 rule-based checks against the parsed layout/text
6. Candidate + ATS report persisted to Postgres
7. Full structured response returned to the client

**Ranking flow:**
1. Client creates a job description (`POST /api/job-descriptions`) — required skills auto-extracted
2. Client triggers ranking (`POST /api/job-descriptions/{id}/rank`)
3. Every stored candidate is scored against the JD: TF-IDF similarity + skill overlap → weighted composite score
4. Results persisted and returned sorted, highest match first

---

## Database Schema

| Table | Purpose |
|---|---|
| `candidates` | One row per uploaded resume — parsed text, extracted skills/contact/education/experience |
| `ats_reports` | One row per ATS scan — overall score, 7 check results, suggestions |
| `job_descriptions` | One row per JD — title, text, extracted required skills |
| `match_scores` | One row per candidate × JD ranking — similarity, overlap, composite score, matched/missing skills |
| `skill_categories` | The 10 skill category labels |
| `skills` | 88 skills — canonical name, alias spellings, category |
| `job_fields` | The 8 professional field labels |
| `skill_field_relevance` | Weighted skill → field associations, powers field detection |

No user/auth tables exist — this is intentionally a single-tenant tool for the current scope (see [Known Limitations](#known-limitations--future-work)).

---

## API Reference

Full interactive documentation is auto-generated at `/docs` (Swagger UI) on the running backend.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload-resume` | Upload & parse a resume, returns candidate + ATS report |
| `GET` | `/api/candidates` | List all candidates with nested latest ATS report |
| `GET` | `/api/candidates/{id}` | Get one candidate |
| `GET` | `/api/candidates/{id}/ats-report` | Get a candidate's latest ATS report |
| `GET` | `/api/candidates/{id}/match/{jd_id}` | Get a candidate's match score against a specific JD |
| `GET` | `/api/candidates/{id}/detected-field` | Detect professional field from a candidate's skills |
| `POST` | `/api/job-descriptions` | Create a job description (auto-extracts required skills) |
| `GET` | `/api/job-descriptions` | List all job descriptions |
| `GET` | `/api/job-descriptions/{id}` | Get one job description |
| `POST` | `/api/job-descriptions/{id}/rank` | Rank all candidates against this JD |
| `GET` | `/api/job-descriptions/{id}/detected-field` | Detect professional field from a JD's required skills |
| `GET` | `/api/skills` | List skills dataset (filter by `?category=` or `?field=`) |
| `POST` | `/api/skills` | Add a new skill to the dataset |
| `POST` | `/api/skills/refresh` | Manually rebuild the extraction cache |
| `GET` | `/api/fields` | List all professional fields |
| `GET` | `/api/fields/{id}/skills` | List skills for a specific field, ranked by relevance |
| `GET` | `/health` | Backend health check |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for local dev — zero setup)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

cp .env.example .env            # edit DATABASE_URL if using Postgres locally
uvicorn app.main:app --reload
```

The skills dataset seeds itself automatically on first boot against an empty database — no manual seeding step required.

API available at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_BASE_URL to your backend URL
npm run dev
```

App available at `http://localhost:5173`.

### Optional: populate demo data

```bash
cd backend
python seed_data/generate_resumes.py   # generates 10 synthetic sample resumes
python seed_data/seed.py                # uploads them + creates sample JDs + runs ranking
```

---

## Environment Variables

**Backend (`backend/.env`)**

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres (or SQLite) connection string | `postgresql://user:pass@host:5432/dbname` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `https://hiresense-sepia.vercel.app` |
| `MAX_UPLOAD_SIZE_MB` | Max resume upload size | `5` |
| `ALLOWED_EXTENSIONS` | Accepted file types | `.pdf,.docx` |
| `APP_ENV` | Environment label | `production` |

**Frontend (`frontend/.env`)**

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | URL of the deployed backend API |

---

## Deployment

- **Frontend:** deployed on [Vercel](https://hiresense-sepia.vercel.app/), framework preset Vite, root directory `frontend`
- **Backend:** deployed on [Render](https://lakshay-aggarwal-pbel-3-0.onrender.com) as a Web Service, root directory `backend`, with a managed Render PostgreSQL instance
- Build command: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Project Structure

```
Smart_Resume_Screening_and_Candidate_Ranking_Tool/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint, auto-seeding on boot
│   │   ├── config.py             # Environment-driven settings
│   │   ├── database.py           # SQLAlchemy engine/session
│   │   ├── models/                # Candidate, JobDescription, MatchScore,
│   │   │                          # ATSReport, Skill, SkillCategory, JobField
│   │   ├── schemas/                # Pydantic request/response contracts
│   │   ├── parsers/                # PDF / DOCX parsing
│   │   ├── nlp/                    # Skill extraction, ATS checker,
│   │   │                           # matcher (TF-IDF), field detector
│   │   ├── routes/                 # upload, rank, skills endpoints
│   │   └── data/                   # Skills taxonomy seed dataset
│   ├── scripts/seed_skills.py     # Manual seed script (also runs automatically)
│   └── seed_data/                  # Synthetic demo resumes + JDs
└── frontend/
    └── src/
        ├── pages/                  # Dashboard, Candidates, Jobs, Settings...
        ├── components/             # ui/, layout/, candidates/, jobs/, ranking/
        ├── context/                 # AppData, Preferences, SidebarUI
        └── services/                 # API client layer
```

---

## Known Limitations & Future Work

- **No authentication** — the app is currently single-tenant; every candidate/JD is globally visible. Multi-user support would require a user model, JWT auth, and per-user data scoping.
- **TF-IDF instead of transformer embeddings** — a deliberate memory/cost tradeoff for free-tier hosting (see [Tech Stack](#tech-stack)). Swapping back to `sentence-transformers` is a self-contained change to `compute_semantic_similarity()`.
- **No notification system** — the UI has a notifications panel with an honest empty state; no backend event model exists behind it yet.
- **No hiring-funnel/analytics dashboards** beyond real, session-derived charts (e.g. ATS score distribution) — there's no data model for application-stage tracking yet.

---

## Author

**Lakshay Aggarwal**
B.Tech CSE (Data Science), ABES Engineering College