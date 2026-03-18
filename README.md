# DJ Request App

A full-stack song request app for DJs and their guests. Guests search YouTube, request songs, and vote on each other's picks. DJs manage events, track requests in real time, match against their local library, and download tracks — all from a mobile-friendly dashboard.

## Features

- **Guest song requests** — Search YouTube, request songs, upvote favorites
- **Real-time updates** — Live polling keeps the request list in sync
- **Smart deduplication** — Duplicate requests auto-merge into a single entry with combined votes
- **Library matching** — Fuzzy-match requests against the DJ's local music library with confidence scores
- **Download manager** — Single or batch download via yt-dlp with progress tracking
- **QR code sharing** — Generate QR codes and shareable links for events
- **CSV export** — Export the full request list with voter info
- **Guest messages** — Contact form for guests after the event closes
- **Mobile responsive** — Tailwind CSS UI optimized for phones

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express 5, better-sqlite3 |
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| APIs | YouTube Data API v3 |
| Tools | yt-dlp, ffmpeg |

## Getting Started

### Prerequisites

- Node.js 20.19+ (20.17+ works with warnings)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [ffmpeg](https://ffmpeg.org/) for downloads
- A [YouTube Data API v3](https://console.cloud.google.com/) key

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/bijujacobt-hue/dj-request-app.git
   cd dj-request-app
   ```

2. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment**

   Create `backend/.env`:
   ```
   PORT=3001
   DB_PATH=data/dj_requests.db
   YOUTUBE_API_KEY=your_youtube_api_key
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start dev servers**

   Backend (port 3001):
   ```bash
   cd backend && npm run dev
   ```

   Frontend (port 5173):
   ```bash
   cd frontend && npm run dev
   ```

   The Vite dev server proxies `/api` requests to the backend automatically.

5. **Open the app** at `http://localhost:5173`

## Project Structure

```
dj-request-app/
├── backend/
│   ├── server.js              # Express entry point
│   ├── database/              # SQLite schema & connection
│   ├── routes/                # API routes (dj, events, guests, requests, search, library, downloads, contacts)
│   ├── services/              # Business logic (matcher, libraryScanner, downloader, nameGenerator)
│   └── utils/                 # ID generation helpers
├── frontend/
│   ├── src/
│   │   ├── pages/             # Route pages (DJDashboard, EventManager, GuestEvent, EventClosed)
│   │   ├── components/        # UI components (SearchBar, RequestCard, DownloadManager, etc.)
│   │   ├── hooks/             # Custom hooks (usePolling)
│   │   └── utils/             # API client
│   └── vite.config.js         # Vite config with API proxy
└── data/                      # SQLite database (created on first run)
```

## Testing

```bash
# Run all backend tests (101 tests, ~1.4s)
cd backend && npm test

# Watch mode for development
cd backend && npm run test:watch

# Run frontend tests
cd frontend && npm test
```

Backend tests use in-memory SQLite for isolation. See `TEST_PLAN.md` for the full test plan.

## How It Works

1. **DJ creates an account** and starts an event
2. **Guests join** via QR code or shared link — assigned a random display name
3. **Guests search YouTube** and submit song requests
4. **Voting** — Guests upvote requests; duplicates merge automatically
5. **DJ monitors** the live request list, sorted by votes, with library match indicators
6. **DJ downloads** requested tracks directly from the dashboard
7. **Event closes** — Guests can leave contact messages for future bookings

## Claude Code Development Process

This project is developed with [Claude Code](https://claude.com/claude-code). Here's how the AI assistant uses the project's instruction files during development:

### Before writing code

| File | Purpose |
|------|---------|
| `MEMORY.md` | Auto-loaded every conversation. Index of project memories: known patterns, gotchas, testing approaches, and progress. Lives in `.claude/projects/.../memory/`. |
| `current_status.md` | Where we left off — completed phases, test counts, and the prioritized list of next actions. |
| `CLAUDE_CODE_PROJECT_PLAN.md` | Original implementation spec: database schema, API endpoints, phase-by-phase build guide, and success criteria. |
| `ARCHITECTURE.md` | Current system design: route modules, data flow, component inventory, test infrastructure. |
| `TEST_PLAN.md` | Full test plan with per-endpoint test cases, frontend component tests, integration workflows, and mobile validation checks. |

### During coding

- **`ARCHITECTURE.md`** is referenced for route patterns, DB schema, and component structure.
- **Memory files** (in `.claude/projects/.../memory/`) are checked for known gotchas — e.g., ESM dynamic imports for `music-metadata`, `vi.mock` limitations with CJS, vote route paths being nested under `/api/requests/votes`.

### After coding

| File | What gets updated |
|------|-------------------|
| `current_status.md` | Progress, test counts, completed actions, next steps |
| `CLAUDE_CODE_PROJECT_PLAN.md` | Checklists and phase completion markers |
| `ARCHITECTURE.md` | New routes, components, tables, or test files added |
| `MEMORY.md` + memory files | New learnings, patterns, or gotchas discovered during the session |

### Memory system

Persistent memories are stored as individual markdown files under `.claude/projects/.../memory/` and indexed in `MEMORY.md`. Categories include:

- **user** — who the developer is, their preferences and expertise
- **feedback** — corrections and confirmed approaches (what to avoid, what to keep doing)
- **project** — ongoing work context, decisions, deadlines
- **reference** — pointers to external resources (APIs, dashboards, issue trackers)

Memories carry across conversations so context isn't lost between sessions.

## License

MIT
