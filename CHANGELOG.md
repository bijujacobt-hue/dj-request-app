# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-17

### Added
- Smart search placeholder showing supported sources (YouTube, SoundCloud)
- Thumbs-up vote icon replacing chevron-up for clearer interaction
- Clickable song titles and thumbnails (open source URL in new tab) on both guest and DJ views
- Guest can delete own request when they are the sole voter (X button with confirmation)
- Database migration system for schema evolution
- DJ-configurable footer text per event (shown on guest page and closed event page)
- Per-event download folder with save/browse support
- Folder browser modal for visual directory navigation (library scan + download folder)
- Messages tab in EventManager showing guest contact form submissions
- Ghibli-inspired animated background on guest-facing pages (CSS-only gradients + floating particles)
- Mobile responsive polish (tighter button padding, safe-area support, 4-tab overflow handling)
- Tabular-nums for consistent rank number alignment in request lists
- Comprehensive documentation (TEST_PLAN.md, CHANGELOG.md, ARCHITECTURE.md, DESIGN_GUIDELINES.md)

### Changed
- EventManager tabs expanded from 3 to 4 (added Messages)
- Tab styling updated for mobile (text-xs on small screens, overflow-x-auto)
- Request list rank number width increased from w-6 to w-7 for double-digit support
- DownloadManager now accepts event prop and passes download folder to API calls

### Fixed
- Rank number alignment inconsistency between guest and DJ views

## [1.0.0] - 2026-02-01

### Added
- DJ profile creation and login with persistent DJ ID
- Event lifecycle management (create, close, delete)
- Guest auto-creation with cookie persistence per event
- Random fun guest name generation
- YouTube Data API v3 song search with rate limiting
- Song request system with automatic duplicate merging
- Upvote/downvote system with voter tracking
- Real-time polling for live request updates (5-second intervals)
- QR code generation for event sharing
- Event link copy to clipboard
- CSV export of requests with all metadata
- Music library scanning with metadata extraction (music-metadata)
- Fuzzy matching of requests against local DJ library
- yt-dlp powered downloads with progress tracking
- Single and batch download support
- Audio quality detection and low-quality warnings
- Contact form on closed event pages
- Toast notification system
- Mobile-responsive design with Tailwind CSS
- SQLite database with WAL mode and foreign keys
