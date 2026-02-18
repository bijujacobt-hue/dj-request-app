-- DJs table
CREATE TABLE IF NOT EXISTS djs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    library_paths TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    dj_id TEXT NOT NULL,
    name TEXT NOT NULL,
    event_date TEXT,
    is_active INTEGER DEFAULT 1,
    download_folder TEXT,
    footer_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (dj_id) REFERENCES djs(id)
);

-- Song requests table
CREATE TABLE IF NOT EXISTS requests (
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
CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    UNIQUE(request_id, guest_id)
);

-- DJ's music library cache
CREATE TABLE IF NOT EXISTS library (
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
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Downloads tracking
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    file_path TEXT,
    quality_level TEXT,
    bitrate INTEGER,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);
