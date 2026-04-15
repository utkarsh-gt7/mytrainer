# FitTracker 💪

[![CI/CD Pipeline](https://github.com/utkarsh-gt7/mytrainer/actions/workflows/ci.yml/badge.svg)](https://github.com/utkarsh-gt7/mytrainer/actions/workflows/ci.yml) — Body Recomp

A full-stack fitness tracking application built for body recomposition. Track workouts, log calories with AI-powered food image analysis, monitor body metrics, and view detailed progress analytics.

## Features

- **Workout Tracking** — Log sets, reps, and weight for every exercise with automatic rest timer
- **6-Day PPL Plan** — Pre-loaded Push/Pull/Legs split optimized for hypertrophy and strength
- **Exercise Library** — Full CRUD on 50+ exercises with search and muscle group filtering
- **Calorie Tracker** — Manual entry + AI food image analysis via Google Gemini
- **Body Metrics** — Weekly weight, body fat, BMI tracking with measurement history
- **Progress Analytics** — Charts for weekly workouts, calories, weight trend, and dynamic key notes
- **PR Tracking** — Automatic personal record detection and history
- **Gamification** — Workout streaks with visual indicators
- **Export** — JSON data export and CSV workout export
- **Dark/Light Mode** — Full theme support
- **Responsive** — Mobile-first with sidebar navigation on desktop
- **PWA Ready** — Installable as a progressive web app (config included)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | TailwindCSS 3 |
| State | Zustand (persisted to localStorage) |
| Backend | Firebase Firestore + Storage (optional) |
| AI | Google Gemini 1.5 Flash (food analysis) |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |
| CI/CD | GitHub Actions + SonarCloud + Docker + Netlify |

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd fitness-tracker
npm install --legacy-peer-deps

# Configure environment (optional)
cp .env.example .env
# Edit .env with your Firebase and Gemini API keys

# Development
npm run dev

# Build
npm run build

# Test
npm run test
npm run test:coverage
```

## Environment Variables

All optional — the app works fully with localStorage when Firebase is not configured, and uses mock data when Gemini is not configured.

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |

## Docker

```bash
# Build and run
docker compose up --build

# Or manually
docker build -t fitness-tracker .
docker run -p 8080:80 fitness-tracker
```

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`):
1. **Lint** — ESLint checks
2. **Test** — Vitest with coverage report
3. **Build** — Production build
4. **SonarCloud** — Code quality analysis
5. **Docker** — Build and push to GHCR
6. **Deploy** — Automatic deploy to Netlify

**Required GitHub Secrets:**
- `SONAR_TOKEN` — SonarCloud authentication token
- `NETLIFY_AUTH_TOKEN` — Netlify personal access token
- `NETLIFY_SITE_ID` — Netlify site ID

**Alternative: Jenkins** (`Jenkinsfile`) with Docker + Kubernetes deployment is also included.

## Project Structure

```
src/
├── components/layout/   # AppLayout, Sidebar, MobileNav
├── data/                # Exercise database, default workout plan
├── hooks/               # useRestTimer
├── pages/               # Dashboard, TodayWorkout, WeeklyPlan, etc.
├── services/            # Firebase, Gemini AI, localStorage
├── store/               # Zustand store (useAppStore)
├── types/               # TypeScript interfaces
└── utils/               # cn(), calculations, formatters
```

## License

MIT
