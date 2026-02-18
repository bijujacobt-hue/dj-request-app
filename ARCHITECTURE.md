# DJ Request App - Architecture Document

## System Overview

Full-stack DJ song request application. DJs create events and share links/QR codes with guests. Guests search for songs (YouTube), request them, and vote on existing requests. DJs manage requests, scan their local music library for matches, download songs, and view guest messages.

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite via better-sqlite3, CommonJS modules
- **Frontend**: React 19, Vite 7, Tailwind CSS 4, React Router 7
- **External tools**: yt-dlp (downloads), ffmpeg (audio conversion)
- **APIs**: YouTube Data API v3

## Backend Architecture (port 3001)

### Entry Point

- `backend/server.js` - Express app setup, CORS, JSON body parsing, route mounting, error handler

### Route Modules (8 total, mounted at /api/*)

1. `/api/dj` (dj.js) - POST /create, POST /login, GET /:id, PUT /:id
2. `/api/events` (events.js) - POST /, GET /dj/:djId, GET /:id, PUT /:id/close, PUT /:id (update footer_text/download_folder), DELETE /:id
3. `/api/guests` (guests.js) - POST /, GET /:id, PUT /:id/name
4. `/api/requests` (requests.js) - GET /event/:eventId, POST / (with duplicate merging), DELETE /:id/guest/:guestId (sole voter delete), DELETE /:id. Also votes: POST /votes, DELETE /votes/:requestId/:guestId
5. `/api/search` (search.js) - GET /youtube?q=... (YouTube Data API v3, rate limited 10/min/IP)
6. `/api/library` (library.js) - GET /browse?path=... (folder navigation), POST /scan, GET /dj/:djId, DELETE /dj/:djId, GET /match/:requestId
7. `/api/downloads` (downloads.js) - POST /start/:requestId, GET /progress/:requestId, POST /cancel/:requestId, POST /batch
8. `/api/contacts` (contacts.js) - POST /, GET /event/:eventId

### Services (4 total)

- `nameGenerator.js` - Generates random fun guest display names
- `libraryScanner.js` - Recursive folder scan for audio files, metadata extraction via music-metadata (ESM dynamic import)
- `matcher.js` - Fuzzy matching of song requests against DJ's local library
- `downloader.js` - yt-dlp wrapper for downloading audio files with progress tracking

### Database

- `database/db.js` - Database initialization, WAL mode, foreign keys, migration system
- `database/schema.sql` - 7 tables: djs, events, requests, guests, votes, library, contacts, downloads
- Location: `data/dj_requests.db` (project root, configurable via DB_PATH env var)

### Utilities

- `utils/helpers.js` - ID generation (generateId with prefixes like dj_, evt_, req_, etc.)

## Frontend Architecture (port 5173)

### Pages (4 routes)

1. `/` and `/dj` --> DJDashboard - DJ login/create, event list, event creation
2. `/dj/event/:eventId` --> EventManager - 4 tabs (Requests, Downloads, Library, Messages), QR code, CSV export, footer editor
3. `/event/:eventId` --> GuestEvent - Guest song search, request list, voting, delete own request
4. EventClosed (rendered by GuestEvent when event.is_active === 0) - Contact form, footer display

### Components

- SearchBar - YouTube search with debounce (500ms), result dropdown
- RequestCard - Song display with clickable links, vote button (thumbs-up), delete button (sole voter)
- RequestList - Ranked list with tabular-nums alignment
- NamePicker - Inline guest name editor
- DownloadManager - Download folder editor with browse, single/batch downloads, progress bars
- FolderBrowser - Modal for server-side directory navigation
- Toast - Notification system via React Context

### Utilities

- `api.js` - Centralized API client (fetch wrapper with error handling)
- `usePolling.js` - Custom hook for periodic data refresh

## Data Flow

### Request Creation Flow

1. Guest searches YouTube via SearchBar --> GET /api/search/youtube
2. Guest selects result --> POST /api/requests (includes source_url, title, artist, thumbnail)
3. Backend checks for duplicate (same source_url in event)
   - If duplicate: adds vote to existing request (merge), returns merged=true
   - If new: creates request + initial vote
4. Frontend polls GET /api/requests/event/:eventId every 5 seconds

### Vote Flow

- Add: POST /api/requests/votes --> increments vote_count
- Remove: DELETE /api/requests/votes/:requestId/:guestId --> decrements vote_count
- Guest delete: DELETE /api/requests/:id/guest/:guestId --> validates sole voter, deletes request

### Guest Persistence

- Cookie `guestId_{eventId}` stored for 30 days
- On page load: check cookie --> try GET /api/guests/:id --> create new if not found

## Database Schema

### Core Tables

- **djs**: id, name, contact_email, contact_phone, library_paths
- **events**: id, dj_id(FK), name, event_date, is_active, download_folder, footer_text, closed_at
- **requests**: id, event_id(FK), title, artist, source, source_url, thumbnail_url, duration_seconds, vote_count
- **guests**: id, event_id(FK), display_name
- **votes**: id, request_id(FK), guest_id(FK), UNIQUE(request_id, guest_id)
- **library**: id, dj_id(FK), file_path, filename, title, artist, album, duration_seconds, format, bitrate, file_size_bytes
- **contacts**: id, event_id(FK), guest_name, contact_info, message
- **downloads**: id, request_id(FK), file_path, quality_level, bitrate

### Cascade Deletes

- events --> requests, guests (CASCADE)
- requests --> votes, downloads (CASCADE)
- guests --> votes (CASCADE)
