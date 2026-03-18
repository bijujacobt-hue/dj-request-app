# DJ Request App - Current Status

> **Last updated**: 2026-03-18
> **Branch**: `main` (2 commits)

---

## Project Completion Summary

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| Phase 1 | Backend Foundation (DJ + Events) | COMPLETE | All endpoints working |
| Phase 2 | Request & Voting System | COMPLETE | Duplicate merge, vote counts, sole-voter delete all working |
| Phase 3 | Search Integration | COMPLETE | YouTube Data API v3 with rate limiting (10/min/IP) |
| Phase 4 | Library Scanner & Matcher | COMPLETE | Folder browse, scan, fuzzy matching all working |
| Phase 5 | Download Manager | COMPLETE | yt-dlp + ffmpeg installed, single/batch/cancel/progress endpoints |
| Phase 6 | Frontend - Guest Interface | COMPLETE | GuestEvent page, SearchBar, RequestList, NamePicker, voting UI |
| Phase 7 | Frontend - DJ Dashboard | COMPLETE | DJDashboard, EventManager (4 tabs), DownloadManager, FolderBrowser |
| Phase 8 | Polish & Features | COMPLETE | Contact form, QR codes, CSV export, Toast notifications, footer editor |

**Overall: All 8 implementation phases are COMPLETE.**

---

## Testing Progress

### Backend Tests: 101 PASSING (9 test files, ~1.4s)

| Test File | Tests | Status |
|-----------|-------|--------|
| **Route Tests (5 files, 74 tests)** | | |
| `tests/routes/dj.test.js` | 13 | PASSING |
| `tests/routes/events.test.js` | 14 | PASSING |
| `tests/routes/guests.test.js` | 10 | PASSING |
| `tests/routes/requests.test.js` | 27 | PASSING |
| `tests/routes/contacts.test.js` | 10 | PASSING |
| **Service Tests (4 files, 27 tests)** | | |
| `tests/services/nameGenerator.test.js` | 5 | PASSING |
| `tests/services/matcher.test.js` | 11 | PASSING |
| `tests/services/libraryScanner.test.js` | 7 | PASSING |
| `tests/services/downloader.test.js` | 4 | PASSING |

**Route test coverage:**
- All CRUD operations for DJs, Events, Guests, Requests, Contacts
- Input validation (missing/empty fields, nonexistent IDs)
- Duplicate request merging with vote count accuracy
- Sole-voter delete validation (allow, reject, wrong guest)
- Vote add/remove with duplicate detection
- Closed event rejection (guests, requests)
- Cascade delete (event deletion removes guests/requests)
- Regression: 5-guest merge accuracy, unvote after merge, sole-voter recovery

**Service test coverage:**
- nameGenerator: format ("Adjective Animal"), uniqueness, valid word lists
- matcher: exact match (100%), case-insensitive, YouTube suffix stripping, partial+artist (80%), title-only (50%), filename (40%), no match, top-3 sorting, metadata in results
- libraryScanner: nonexistent folder error, empty folder, non-audio filter, 7 audio extensions, recursive scan, ESM dynamic import
- downloader: getProgress (not_started, complete from DB), cancelDownload (no active), module exports

**Test infrastructure:**
- Vitest v4.1 with in-memory SQLite (NODE_ENV=test)
- `database/db.js` is test-aware: uses `:memory:` SQLite when `NODE_ENV=test` or `VITEST` env var is set
- `db._resetForTest()` clears all tables between tests (respects FK order)
- supertest for HTTP route assertions
- `npm test` runs full suite in ~1.4s
- `npm run test:watch` for development
- **Key lesson**: `vi.mock` does NOT reliably intercept transitive CJS `require()` calls — solved by making `db.js` test-aware instead of mocking

### Frontend Tests: 66 PASSING (8 test files, ~5.5s)

| Test File | Tests | Status |
|-----------|-------|--------|
| **Component Tests (7 files, 64 tests)** | | |
| `src/components/SearchBar.test.jsx` | 8 | PASSING |
| `src/components/RequestCard.test.jsx` | 15 | PASSING |
| `src/components/RequestList.test.jsx` | 4 | PASSING |
| `src/components/NamePicker.test.jsx` | 8 | PASSING |
| `src/components/Toast.test.jsx` | 5 | PASSING |
| `src/components/FolderBrowser.test.jsx` | 10 | PASSING |
| `src/components/DownloadManager.test.jsx` | 12 | PASSING |
| **Setup** | | |
| `src/smoke.test.jsx` | 2 | PASSING |

**Component test coverage:**
- SearchBar: input, search trigger, empty guard, result display, selection callback, result clearing, loading state
- RequestCard: title/artist/votes/thumbnail render, voter names (+N more), source link, vote/unvote, sole-voter delete with confirm/cancel, duration format
- RequestList: empty state, rendering all cards, rank numbers
- NamePicker: display name, change/edit/save/cancel flow, Enter key, disabled on empty
- Toast: success/error display, auto-dismiss, multiple stacking, useToast hook
- FolderBrowser: directory listing, navigation (in/up), current path display, select/close, error handling, empty state
- DownloadManager: folder input/save, browse button, request items, DL/batch download, checkboxes, completed status

---

## External Dependencies Status

| Tool | Status | Version |
|------|--------|---------|
| Node.js | Installed (warning: v20.17.0, Vite wants 20.19+) | v20.17.0 |
| yt-dlp | Installed | 2026.02.04 |
| ffmpeg | Installed | Available |
| YouTube API Key | Configured | Working (returns results) |

---

## What's NOT Done Yet

### 1. Mobile Responsiveness (Code Audit Complete)
- All critical layout and touch target issues fixed (see Action 4 in completed log)
- Manual verification at 320px recommended for visual confirmation

### 2. Frontend Component Tests — COMPLETE (66 tests passing)

### 3. Integration / E2E Tests — COMPLETE (12 tests passing)
- Remaining: Library scan/match flow and download folder tests (require filesystem/yt-dlp setup)

### 4. Input Validation Hardening — COMPLETE

### 5. Node.js Version
- Running v20.17.0, Vite 7 recommends 20.19+

---

## Recommended Next Actions (Priority Order)

### Action 5: Frontend Component Tests
Cover Section 1.3 with React Testing Library:
- SearchBar, RequestCard, RequestList, NamePicker
- DownloadManager, FolderBrowser, Toast

### Action 6: Integration / E2E Tests
Install Playwright and implement the 5 integration workflows from Section 2

### Action 7: Input Validation Hardening
- Add server-side validation for all endpoints
- Add length limits on text fields
- Consider rate limiting beyond just YouTube search

### Action 8: Upgrade Node.js
```
nvm install 20.19
nvm use 20.19
```

---

## Completed Actions Log

| Action | Date | Details |
|--------|------|---------|
| Action 1: Test Framework Setup | 2026-03-15 | Vitest installed for backend + frontend, configs created, smoke tests passing |
| Action 2: Backend Route Tests | 2026-03-15 | 74 tests across 5 route files (dj, events, guests, requests, contacts) |
| Action 3: Backend Service Tests | 2026-03-15 | 27 tests across 4 service files (nameGenerator, matcher, libraryScanner, downloader) |
| Action 4: Mobile Responsiveness Audit | 2026-03-18 | Code audit of all 4 pages + 7 components at 320px. Fixed: Toast overflow, DownloadManager folder row wrapping, touch targets on delete/DL/select/cancel buttons, NamePicker wrapping, event name truncation, DJ ID overflow |
| Action 5: Frontend Component Tests | 2026-03-18 | 64 component tests across 7 files (SearchBar, RequestCard, RequestList, NamePicker, Toast, FolderBrowser, DownloadManager) + 2 smoke tests |
| Action 6: E2E Tests (Playwright) | 2026-03-18 | 12 E2E tests across 3 files: DJ workflow (4), guest cookie persistence (3), DJ localStorage persistence (5). Chromium headless, ~15s |
| Action 7: Input Validation Hardening | 2026-03-18 | Added: shared validation helpers (utils/helpers.js), length limits on all text fields, URL format validation, path traversal prevention (safePath), LIKE pattern escape, batch size limit (50), JSON body size limit (100kb), duration validation |

**Key technical decisions made during testing:**
- Renamed `vitest.config.js` to `vitest.config.mjs` (ESM config in CJS project)
- Used `happy-dom` instead of `jsdom` for frontend (avoids ESM issues on Node 20.17)
- Made `database/db.js` test-aware instead of using `vi.mock` (more reliable for CJS transitive requires)

---

## File Structure (Current)

```
dj-request-app/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   ├── vitest.config.mjs
│   ├── database/       (db.js, schema.sql)
│   ├── routes/         (8 files: dj, events, guests, requests, search, library, downloads, contacts)
│   ├── services/       (4 files: nameGenerator, libraryScanner, matcher, downloader)
│   ├── utils/          (helpers.js)
│   └── tests/
│       ├── setup.js    (in-memory DB + app factory + resetDb helper)
│       ├── routes/     (dj, events, guests, requests, contacts)
│       └── services/   (nameGenerator, matcher, libraryScanner, downloader)
├── frontend/
│   ├── vite.config.js  (includes test config with happy-dom)
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.jsx, main.jsx
│       ├── test-setup.js
│       ├── smoke.test.jsx
│       ├── pages/      (4 files: DJDashboard, EventManager, GuestEvent, EventClosed)
│       ├── components/ (7 files: SearchBar, RequestCard, RequestList, NamePicker, DownloadManager, FolderBrowser, Toast)
│       ├── hooks/      (usePolling.js)
│       └── utils/      (api.js)
├── data/               (dj_requests.db - auto-created)
├── ARCHITECTURE.md
├── README.md
├── TEST_PLAN.md
├── CLAUDE_CODE_PROJECT_PLAN.md
└── current_status.md   (this file)
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Run backend tests | `cd backend && npm test` |
| Run frontend tests | `cd frontend && npm test` |
| Watch mode tests | `cd backend && npm run test:watch` |
| Open app | `http://localhost:5173` |
| DJ dashboard | `http://localhost:5173/dj` |
| Guest event page | `http://localhost:5173/event/:eventId` |
