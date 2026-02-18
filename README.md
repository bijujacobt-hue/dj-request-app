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

## How It Works

1. **DJ creates an account** and starts an event
2. **Guests join** via QR code or shared link — assigned a random display name
3. **Guests search YouTube** and submit song requests
4. **Voting** — Guests upvote requests; duplicates merge automatically
5. **DJ monitors** the live request list, sorted by votes, with library match indicators
6. **DJ downloads** requested tracks directly from the dashboard
7. **Event closes** — Guests can leave contact messages for future bookings

## License

MIT
