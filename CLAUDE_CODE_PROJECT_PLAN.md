# DJ Request App - Claude Code Implementation Guide

> **Instructions for Claude Code**: Build this DJ song request management system following the specifications below. Start with Phase 1 and work through each phase sequentially. Test each component before proceeding.

---

## Quick Overview

**What we're building**: A web app where DJs create events, share links with guests who request songs (searched via YouTube/SoundCloud), see requests ranked by votes, and download missing songs automatically.

**Tech Stack**:
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Downloads**: yt-dlp (must be installed separately)
- **APIs**: YouTube Data API v3, SoundCloud API

**Key Features**:
- No traditional login (DJs use simple ID)
- Anonymous guest names (e.g., "Pink Lion", "Happy Panda")
- Real-time voting on song requests
- Auto-match requests to DJ's local music library
- Download missing songs via yt-dlp

---

## Database Schema

```sql
-- DJs table
CREATE TABLE djs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    library_paths TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    dj_id TEXT NOT NULL,
    name TEXT NOT NULL,
    event_date TEXT,
    is_active INTEGER DEFAULT 1,
    download_folder TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (dj_id) REFERENCES djs(id)
);

-- Song requests table
CREATE TABLE requests (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    vote_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Guests table
CREATE TABLE guests (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Votes table
CREATE TABLE votes (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    UNIQUE(request_id, guest_id)
);

-- DJ's music library cache
CREATE TABLE library (
    id TEXT PRIMARY KEY,
    dj_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    title TEXT,
    artist TEXT,
    album TEXT,
    duration_seconds INTEGER,
    format TEXT,
    bitrate INTEGER,
    file_size_bytes INTEGER,
    last_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dj_id) REFERENCES djs(id) ON DELETE CASCADE
);

-- Contact form submissions
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Downloads tracking
CREATE TABLE downloads (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    file_path TEXT,
    quality_level TEXT,
    bitrate INTEGER,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);
```

---

## Project Structure

```
dj-request-app/
├── backend/
│   ├── package.json
│   ├── .env
│   ├── server.js
│   ├── database/
│   │   ├── db.js
│   │   └── schema.sql
│   ├── routes/
│   │   ├── dj.js
│   │   ├── events.js
│   │   ├── requests.js
│   │   ├── guests.js
│   │   ├── library.js
│   │   ├── downloads.js
│   │   └── search.js
│   ├── services/
│   │   ├── nameGenerator.js
│   │   ├── libraryScanner.js
│   │   ├── downloader.js
│   │   └── matcher.js
│   └── utils/
│       └── helpers.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── GuestEvent.jsx
│   │   │   ├── DJDashboard.jsx
│   │   │   ├── EventManager.jsx
│   │   │   └── EventClosed.jsx
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── RequestList.jsx
│   │   │   ├── RequestCard.jsx
│   │   │   ├── NamePicker.jsx
│   │   │   └── DownloadManager.jsx
│   │   ├── hooks/
│   │   │   └── usePolling.js
│   │   └── utils/
│   │       └── api.js
│   └── public/
└── data/
    └── dj_requests.db (generated)
```

---

## Implementation Phases

### Phase 1: Backend Foundation ✅ START HERE

**Goal**: Set up Express server, SQLite database, and core DJ/Event functionality

**Tasks**:
1. Initialize backend with npm
2. Install dependencies: `express`, `better-sqlite3`, `cors`, `uuid`, `dotenv`
3. Create `database/db.js` to initialize SQLite connection
4. Create `database/schema.sql` with all tables
5. Create `server.js` with basic Express setup
6. Create `.env` file template

**Endpoints to implement**:
```javascript
// DJ routes
POST   /api/dj/create          // Create new DJ profile → returns DJ ID
POST   /api/dj/login           // Login with DJ ID → returns DJ info
GET    /api/dj/:id             // Get DJ profile
PUT    /api/dj/:id             // Update DJ profile

// Event routes
POST   /api/events             // Create new event → returns event ID
GET    /api/events/dj/:djId    // Get all events for a DJ
GET    /api/events/:id         // Get single event details
PUT    /api/events/:id/close   // Close an event
DELETE /api/events/:id         // Delete an event
```

**Test criteria**:
- Server starts on port 3001
- Database file is created
- Can create DJ profile and get unique ID
- Can create event and get shareable event ID

---

### Phase 2: Request & Voting System

**Goal**: Implement song requests, guest system, and voting

**Tasks**:
1. Create `services/nameGenerator.js` - Generate fun anonymous names
2. Create `routes/guests.js` - Guest creation and management
3. Create `routes/requests.js` - Request CRUD and voting

**Name Generator Logic**:
```javascript
// Combine random adjective + animal
const adjectives = ['Happy', 'Pink', 'Angry', 'Calm', 'Silly', 'Brave', 'Gentle', 'Wild', 'Cool', 'Zen'];
const animals = ['Lion', 'Panda', 'Tiger', 'Elephant', 'Dolphin', 'Eagle', 'Fox', 'Bear', 'Wolf', 'Owl'];
```

**Endpoints**:
```javascript
// Guest routes
POST   /api/guests                    // Create guest for event
GET    /api/guests/:guestId           // Get guest info
PUT    /api/guests/:guestId/name      // Update guest name

// Request routes
GET    /api/requests/event/:eventId   // Get all requests for event (sorted by votes)
POST   /api/requests                  // Create new request
DELETE /api/requests/:id              // Remove request

// Vote routes
POST   /api/votes                     // Add vote to request
DELETE /api/votes/:requestId/:guestId // Remove vote
```

**Business Logic**:
- When guest requests an already-requested song → add their vote, merge into existing request
- Display voter names: "Pink Lion, Happy Panda +10 more"
- Songs sorted by vote_count DESC
- If original requester removes but others voted → song stays

**Test criteria**:
- Guest can be created with random name
- Guest can request a song
- Requesting duplicate song adds vote instead
- Vote count updates correctly
- Can remove own request (song stays if others voted)

---

### Phase 3: Search Integration

**Goal**: Integrate YouTube and SoundCloud search APIs

**Tasks**:
1. Set up YouTube API key in `.env`
2. Create `routes/search.js` for search endpoints
3. Implement YouTube Data API v3 search
4. (Optional) Implement SoundCloud search

**YouTube Search Setup**:
```javascript
// Install: npm install axios
// API endpoint: https://www.googleapis.com/youtube/v3/search

const params = {
  part: 'snippet',
  q: searchQuery,
  type: 'video',
  videoCategoryId: '10', // Music category
  maxResults: 10,
  key: process.env.YOUTUBE_API_KEY
};
```

**Endpoints**:
```javascript
GET /api/search/youtube?q=song+name     // Search YouTube
GET /api/search/soundcloud?q=song+name  // Search SoundCloud (optional)
```

**Response format**:
```javascript
{
  results: [
    {
      id: 'video_id',
      title: 'Song Title',
      artist: 'Artist Name',
      thumbnail: 'https://...',
      duration: 180,
      source: 'youtube',
      url: 'https://youtube.com/watch?v=...'
    }
  ]
}
```

**Test criteria**:
- Can search for songs via YouTube
- Results include thumbnails
- Can create request from search result

---

### Phase 4: Library Scanner & Matcher

**Goal**: Scan DJ's music folders and match requests to existing files

**Tasks**:
1. Install `music-metadata` package
2. Create `services/libraryScanner.js` - Scan folders recursively
3. Create `services/matcher.js` - Match requests to library
4. Create `routes/library.js` - Library management endpoints

**Scanner Logic**:
```javascript
// Recursively scan folder
// Read ID3 tags: title, artist, album, duration
// Supported formats: .mp3, .flac, .wav, .m4a, .ogg
// Store in library table with dj_id
```

**Matcher Logic**:
```javascript
// Match request to library songs by:
// 1. Exact title + artist match (100% confidence)
// 2. Title contains + artist match (80% confidence)
// 3. Title match only (50% confidence)
// 4. Filename contains title (40% confidence)
// Return top 3 matches with confidence scores
```

**Endpoints**:
```javascript
POST   /api/library/scan               // Scan folders, return progress
GET    /api/library/dj/:djId           // Get DJ's library
DELETE /api/library/dj/:djId           // Clear library cache
GET    /api/library/match/:requestId   // Find matches for a request
```

**Test criteria**:
- Can scan a music folder
- ID3 tags are read correctly
- Can match a request to existing library file
- Confidence scores make sense

---

### Phase 5: Download Manager

**Goal**: Download missing songs via yt-dlp

**Tasks**:
1. Verify yt-dlp is installed (`yt-dlp --version`)
2. Create `services/downloader.js` - Wrapper around yt-dlp
3. Create `routes/downloads.js` - Download endpoints

**Downloader Setup**:
```javascript
// Use Node.js child_process to spawn yt-dlp
// Command: yt-dlp -f bestaudio --extract-audio --audio-format mp3 
//          --output "path/%(title)s.%(ext)s" [URL]
```

**Features**:
- Track download progress
- Detect audio quality (bitrate)
- Warn if quality is low (<192kbps)
- Organize downloads in event folders
- Support cancellation

**Endpoints**:
```javascript
POST   /api/downloads/start/:requestId    // Start download
GET    /api/downloads/progress/:requestId // Get progress
POST   /api/downloads/cancel/:requestId   // Cancel download
POST   /api/downloads/batch               // Download multiple
```

**Test criteria**:
- Can download a YouTube video as MP3
- Progress updates work
- Files saved to correct event folder
- Quality detection works

---

### Phase 6: Frontend - Guest Interface

**Goal**: Build the guest-facing event page

**Tasks**:
1. Initialize Vite + React + Tailwind
2. Set up React Router
3. Create `pages/GuestEvent.jsx`
4. Implement search, request, and voting UI
5. Add polling for real-time updates

**Key Components**:
- **NamePicker**: Show generated name with [Keep] [Change] [Custom] options
- **SearchBar**: YouTube/SoundCloud search with results dropdown
- **RequestList**: Show all requests sorted by votes
- **RequestCard**: Display song with thumbnail, votes, voter names

**Guest Cookies**:
```javascript
// Store guest ID in cookie for this event
// Format: guestId_eventId = guest_uuid
// On revisit, load guest profile automatically
```

**Polling**:
```javascript
// Poll every 5 seconds for request updates
// useEffect with setInterval
// Compare vote counts to detect changes
```

**Test criteria**:
- Can access event via /event/:eventId
- Name generation works
- Can search and request songs
- Can vote on existing requests
- Real-time updates appear

---

### Phase 7: Frontend - DJ Dashboard

**Goal**: Build DJ dashboard and event manager

**Tasks**:
1. Create `pages/DJDashboard.jsx`
2. Create `pages/EventManager.jsx`
3. Create `components/DownloadManager.jsx`
4. Implement library scanner UI

**DJ Dashboard**:
- Login with DJ ID
- Show all events (active + closed)
- Create new event form
- Quick stats per event

**Event Manager**:
- Show all requests sorted by votes
- Display library match status for each
- Download controls (single or batch)
- Progress indicators for downloads
- Remove request button

**Download Manager**:
- Select event download folder
- Checkbox selection for batch downloads
- Progress bars for active downloads
- Quality warnings for low-bitrate files
- "Download All Missing" button

**Test criteria**:
- DJ can login and see dashboard
- Can create new event and get shareable link
- Can view requests and see library matches
- Can trigger downloads and see progress
- Downloaded files appear in event folder

---

### Phase 8: Polish & Features

**Goal**: Add final features and improvements

**Tasks**:
1. Event closed page with contact form
2. Better error handling
3. Loading states and spinners
4. Mobile responsive design
5. Input validation
6. Rate limiting on search API

**Contact Form** (when event is closed):
```javascript
// Show: "This event has ended"
// Form: Name, Email/Phone, Message
// Save to contacts table
// DJ can view submissions in dashboard
```

**Additional Features**:
- Copy event link button
- QR code for event link
- Export requests as CSV
- Batch operations (delete multiple requests)
- Search result preview (play snippet)

---

## Environment Setup

### Prerequisites
```bash
# Install yt-dlp
brew install yt-dlp   # macOS
# or
pip install yt-dlp    # via Python

# Get YouTube API key
# 1. Go to Google Cloud Console
# 2. Create project
# 3. Enable YouTube Data API v3
# 4. Create credentials (API key)
```

### Backend .env Template
```env
PORT=3001
NODE_ENV=development
DB_PATH=../data/dj_requests.db
YOUTUBE_API_KEY=your_youtube_api_key_here
SOUNDCLOUD_CLIENT_ID=your_soundcloud_id_here
FRONTEND_URL=http://localhost:5173
```

### Installation Commands
```bash
# Backend
cd backend
npm install express better-sqlite3 cors uuid dotenv music-metadata axios

# Frontend
cd frontend
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## API Response Formats

### Request Object
```javascript
{
  id: "req_123",
  event_id: "evt_abc",
  title: "Blinding Lights",
  artist: "The Weeknd",
  source: "youtube",
  source_url: "https://youtube.com/watch?v=...",
  thumbnail_url: "https://i.ytimg.com/...",
  duration_seconds: 200,
  vote_count: 12,
  voters: [
    { guest_id: "g1", display_name: "Pink Lion" },
    { guest_id: "g2", display_name: "Happy Panda" }
  ],
  library_match: {
    matched: true,
    confidence: "exact",
    file_path: "/Users/dj/Music/The Weeknd - Blinding Lights.mp3"
  },
  download_status: null,
  created_at: "2024-02-08T10:30:00Z"
}
```

### Event Object
```javascript
{
  id: "evt_abc123",
  dj_id: "dj_xyz",
  name: "Sarah's Birthday Party",
  event_date: "2024-02-14",
  is_active: true,
  download_folder: "/Users/dj/Music/DJ_Events/2024-02-14_Sarahs_Birthday",
  request_count: 23,
  total_votes: 45,
  created_at: "2024-02-01T12:00:00Z"
}
```

---

## Testing Checklist

### Backend Tests
- ✅ Database initializes correctly
- ✅ DJ can be created and retrieved
- ✅ Event can be created with unique short ID
- ✅ Guest gets random name on creation
- ✅ Request can be added to event
- ✅ Duplicate request adds vote instead
- ✅ Vote count updates correctly
- ✅ YouTube search returns results
- ✅ Library scanner finds music files
- ✅ Matcher finds correct songs
- ✅ yt-dlp downloads work

### Frontend Tests
- ✅ Guest can access event page
- ✅ Name generation and picker works
- ✅ Search returns YouTube results
- ✅ Can request a song
- ✅ Can vote on existing requests
- ✅ Polling updates vote counts
- ✅ DJ can login with ID
- ✅ DJ can create event and get link
- ✅ DJ can see requests in manager
- ✅ Downloads trigger and show progress

---

## Implementation Notes

### Vote Merging Logic
When a guest requests a song that already exists:
1. Check if request exists (match title + source_url)
2. If exists: Add vote for this guest, increment vote_count
3. If not: Create new request with vote_count = 1

### Anonymous Name Persistence
- Names are per-event (same person in Event A and Event B = different names)
- Store guest_id in cookie: `guestId_${eventId}`
- On return visit, load saved guest profile

### Library Matching Priority
1. Try exact title + artist match
2. Fall back to partial title match
3. Show all matches with confidence scores
4. DJ manually confirms correct match

### Download Organization
```
~/Music/DJ_Events/
  └── 2024-02-14_Event_Name/
      ├── downloaded/
      │   ├── Song1.mp3
      │   └── Song2.mp3
      └── event_data.json
```

### Quality Detection
- After download, check bitrate with ffprobe or music-metadata
- Warn if <192kbps: "YouTube quality detected. Consider HQ source for professional use."
- Mark in database for DJ awareness

---

## Quick Start Summary

1. **Install yt-dlp** first (required for downloads)
2. **Get YouTube API key** (required for search)
3. **Start with Phase 1** - Backend foundation
4. **Test each phase** before moving to next
5. **Build incrementally** - Don't skip to Phase 7

**First Command**:
```bash
mkdir dj-request-app && cd dj-request-app
mkdir backend frontend data
```

---

## Success Criteria

The app is complete when:
1. ✅ DJ can create event and share link
2. ✅ Guests can search YouTube and request songs
3. ✅ Voting system works (duplicates merge, counts update)
4. ✅ DJ sees requests sorted by popularity
5. ✅ Library scanner finds local music files
6. ✅ Matcher identifies which requests DJ already has
7. ✅ Missing songs can be downloaded via yt-dlp
8. ✅ Downloads organize into event folders
9. ✅ Real-time updates work (polling or WebSocket)
10. ✅ Mobile responsive and works offline (PWA optional)

---

*Ready for Claude Code implementation - Start with Phase 1!*
