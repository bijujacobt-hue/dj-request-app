# DJ Request App - Comprehensive Test Plan

## Table of Contents

1. [Unit Tests](#1-unit-tests)
   - [Backend Route Tests](#11-backend-route-tests)
   - [Backend Service Tests](#12-backend-service-tests)
   - [Frontend Component Tests](#13-frontend-component-tests)
2. [Integration Tests](#2-integration-tests)
3. [Regression Tests](#3-regression-tests)
4. [Per-Page Validation Checks (320px Mobile Width)](#4-per-page-validation-checks-320px-mobile-width)

---

## 1. Unit Tests

### 1.1 Backend Route Tests

#### 1.1.1 DJ Routes (`/api/dj`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Create a new DJ | POST | `/api/dj` | `{ name: "DJ Test" }` | 201, returns `{ id, name }` |
| 2 | Create DJ with empty name | POST | `/api/dj` | `{ name: "" }` | 400, validation error |
| 3 | Create DJ with missing name field | POST | `/api/dj` | `{}` | 400, validation error |
| 4 | Get DJ by ID | GET | `/api/dj/:id` | valid DJ ID | 200, returns DJ object |
| 5 | Get DJ with invalid ID | GET | `/api/dj/:id` | nonexistent UUID | 404, not found |
| 6 | Create DJ with very long name | POST | `/api/dj` | `{ name: "A".repeat(500) }` | 400 or truncated, depending on validation |

#### 1.1.2 Event Routes (`/api/events`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Create event | POST | `/api/events` | `{ dj_id, name: "Friday Night" }` | 201, returns event with `id`, `name`, `is_active: 1` |
| 2 | Create event with missing dj_id | POST | `/api/events` | `{ name: "Test" }` | 400, validation error |
| 3 | Create event with missing name | POST | `/api/events` | `{ dj_id }` | 400, validation error |
| 4 | List events for a DJ | GET | `/api/events?dj_id=X` | valid dj_id | 200, returns array of events |
| 5 | Get single event | GET | `/api/events/:id` | valid event ID | 200, returns event object |
| 6 | Get nonexistent event | GET | `/api/events/:id` | invalid ID | 404 |
| 7 | Update event footer_text | PUT | `/api/events/:id` | `{ footer_text: "Thanks!" }` | 200, updated event |
| 8 | Update event download_folder | PUT | `/api/events/:id` | `{ download_folder: "/music/downloads" }` | 200, updated event |
| 9 | Close event (set is_active=0) | PUT | `/api/events/:id` | `{ is_active: 0 }` | 200, event with `is_active: 0` |
| 10 | Delete event | DELETE | `/api/events/:id` | valid event ID | 200 or 204, event removed |
| 11 | Delete nonexistent event | DELETE | `/api/events/:id` | invalid ID | 404 |

#### 1.1.3 Guest Routes (`/api/guests`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Create guest for event | POST | `/api/guests` | `{ event_id, name: "Alice" }` | 201, returns guest with `id`, `name`, `event_id` |
| 2 | Create guest with missing event_id | POST | `/api/guests` | `{ name: "Alice" }` | 400 |
| 3 | Get guest by ID | GET | `/api/guests/:id` | valid guest ID | 200, returns guest object |
| 4 | Get nonexistent guest | GET | `/api/guests/:id` | invalid ID | 404 |
| 5 | Create guest with empty name | POST | `/api/guests` | `{ event_id, name: "" }` | 400 |

#### 1.1.4 Request Routes (`/api/requests`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Create song request | POST | `/api/requests` | `{ event_id, guest_id, title, artist, source_url }` | 201, returns request object |
| 2 | Create duplicate request (same source_url) | POST | `/api/requests` | Same `source_url` as existing request | 200, existing request returned with incremented vote count |
| 3 | Create request with missing title | POST | `/api/requests` | No title | 400 |
| 4 | List requests for event | GET | `/api/requests?event_id=X` | valid event_id | 200, returns array sorted by votes desc |
| 5 | Delete own request (sole voter) | DELETE | `/api/requests/:id/guest/:guestId` | Request where guest is only voter | 200, request deleted |
| 6 | Delete request when not sole voter | DELETE | `/api/requests/:id/guest/:guestId` | Request with multiple voters | 403 or 400, deletion refused |
| 7 | Delete request with wrong guest | DELETE | `/api/requests/:id/guest/:guestId` | guestId that never voted | 403 or 404 |
| 8 | Create request on closed event | POST | `/api/requests` | event with `is_active: 0` | 400 or 403 |
| 9 | CSV export of requests | GET | `/api/requests/export?event_id=X` | valid event_id | 200, Content-Type text/csv, valid CSV content |

#### 1.1.5 Vote Routes (`/api/requests/votes`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Add vote to request | POST | `/api/requests/votes` | `{ request_id, guest_id }` | 200, vote count incremented |
| 2 | Remove vote from request | DELETE | `/api/requests/votes` | `{ request_id, guest_id }` | 200, vote count decremented |
| 3 | Add duplicate vote (same guest) | POST | `/api/requests/votes` | Already voted combo | 409 or idempotent 200 |
| 4 | Remove nonexistent vote | DELETE | `/api/requests/votes` | Never-voted combo | 404 or no-op |
| 5 | Vote on request in closed event | POST | `/api/requests/votes` | Closed event request | 400 or 403 |

#### 1.1.6 Search Routes (`/api/search`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Search YouTube | GET | `/api/search?q=never+gonna` | valid query | 200, returns array of results with `title`, `artist`, `source_url`, `thumbnail` |
| 2 | Search with empty query | GET | `/api/search?q=` | empty string | 400 |
| 3 | Search rate limit (11th request in 1 min) | GET | `/api/search?q=test` | 11 rapid requests from same IP | 429, rate limit exceeded |
| 4 | Search rate limit resets after window | GET | `/api/search?q=test` | After 60s cooldown | 200, returns results again |
| 5 | Search with special characters | GET | `/api/search?q=%26%23` | Encoded special chars | 200 or graceful error |

#### 1.1.7 Library Routes (`/api/library`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Trigger library scan | POST | `/api/library/scan` | `{ folder: "/music" }` | 200, scan initiated or completed |
| 2 | Scan nonexistent folder | POST | `/api/library/scan` | `{ folder: "/nonexistent" }` | 400 or 404 |
| 3 | Get library entries for DJ | GET | `/api/library?dj_id=X` | valid dj_id | 200, array of library entries |
| 4 | Match requests against library | POST | `/api/library/match` | `{ event_id }` | 200, returns match results |

#### 1.1.8 Download Routes (`/api/downloads`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Start single download | POST | `/api/downloads` | `{ request_id, source_url, download_folder }` | 200, download started with `download_id` |
| 2 | Start batch download | POST | `/api/downloads/batch` | `{ request_ids: [...], download_folder }` | 200, batch started |
| 3 | Poll download progress | GET | `/api/downloads/:id/progress` | valid download_id | 200, returns `{ status, progress, filename }` |
| 4 | Download with invalid URL | POST | `/api/downloads` | `{ source_url: "not-a-url" }` | 400 |
| 5 | Download without yt-dlp installed | POST | `/api/downloads` | valid input, yt-dlp missing | 500, clear error message |
| 6 | Download to nonexistent folder | POST | `/api/downloads` | `{ download_folder: "/nonexistent" }` | 400 or auto-create folder |

#### 1.1.9 Contact Routes (`/api/contacts`)

| # | Test Case | Method | Endpoint | Input | Expected Result |
|---|-----------|--------|----------|-------|-----------------|
| 1 | Submit contact form | POST | `/api/contacts` | `{ event_id, name, email, message }` | 201, contact saved |
| 2 | Submit with missing email | POST | `/api/contacts` | `{ event_id, name, message }` | 400 |
| 3 | Submit with missing message | POST | `/api/contacts` | `{ event_id, name, email }` | 400 |
| 4 | List contacts for DJ | GET | `/api/contacts?dj_id=X` | valid dj_id | 200, array of contacts |
| 5 | Submit contact to nonexistent event | POST | `/api/contacts` | invalid event_id | 404 |

---

### 1.2 Backend Service Tests

#### 1.2.1 nameGenerator Service

| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Generate a name | (none) | Returns a non-empty string |
| 2 | Generate multiple names | Call 100 times | All returned names are non-empty strings |
| 3 | Names have expected format | (none) | Name matches pattern (e.g., "Adjective Noun" or configured format) |
| 4 | Names are reasonably unique | Generate 50 names | No more than ~10% duplicates (probabilistic) |

#### 1.2.2 libraryScanner Service

| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Scan folder with MP3 files | Folder containing 3 MP3s | Returns 3 entries with `title`, `artist`, `duration`, `filepath` |
| 2 | Scan folder recursively | Nested subfolders with audio | Finds all audio files at all depths |
| 3 | Scan empty folder | Empty directory | Returns empty array |
| 4 | Scan folder with non-audio files | Folder with .txt, .jpg only | Returns empty array |
| 5 | Extract metadata from audio file | MP3 with ID3 tags | Returns correct title, artist, album from tags |
| 6 | Handle audio file without metadata | MP3 with no ID3 tags | Falls back to filename parsing |
| 7 | Scan folder with mixed file types | MP3, FLAC, WAV, OGG, TXT, JPG | Returns only audio files |
| 8 | Handle permission-denied folder | Unreadable directory | Graceful skip or error, no crash |
| 9 | Dynamic import of music-metadata | (none) | `await import('music-metadata')` succeeds (ESM-only module in CommonJS) |

#### 1.2.3 matcher Service

| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Exact title match | Request "Bohemian Rhapsody" vs library entry "Bohemian Rhapsody" | Match with high confidence score |
| 2 | Case-insensitive match | "bohemian rhapsody" vs "Bohemian Rhapsody" | Match found |
| 3 | Fuzzy match with typo | "Bohemain Rhapsody" vs "Bohemian Rhapsody" | Match found (fuzzy) |
| 4 | Title + artist match | "Bohemian Rhapsody" by "Queen" | Higher confidence than title-only match |
| 5 | No match | "Nonexistent Song XYZ123" | No match returned or very low confidence |
| 6 | Partial title match | "Bohemian" vs "Bohemian Rhapsody" | Partial match with moderate confidence |
| 7 | Empty library | Any request | No matches returned |
| 8 | Empty request list | Empty array | Empty results returned |

#### 1.2.4 downloader Service

| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Download YouTube video as audio | Valid YouTube URL, output folder | MP3 file created in target folder |
| 2 | Progress callback fires | Valid URL with progress handler | Progress callbacks received (0-100%) |
| 3 | Download with invalid URL | `"https://youtube.com/watch?v=invalid"` | Error returned, no partial files left |
| 4 | Download to writable folder | Valid URL, writable folder | File saved successfully |
| 5 | Download to read-only folder | Valid URL, unwritable folder | Clear error message |
| 6 | Concurrent downloads | 3 simultaneous downloads | All complete without interference |
| 7 | yt-dlp not found on PATH | Valid URL | Error message indicating yt-dlp not installed |
| 8 | ffmpeg not found on PATH | Valid URL | Error message indicating ffmpeg needed for MP3 conversion |
| 9 | Cancel in-progress download | Active download_id | Process killed, partial file cleaned up |

---

### 1.3 Frontend Component Tests

#### 1.3.1 SearchBar Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Renders input field | Mount component | Input field visible with placeholder text |
| 2 | Typing updates input value | Type "test" | Input value is "test" |
| 3 | Submit triggers search callback | Type + press Enter or click search | `onSearch` callback fires with query string |
| 4 | Empty submit does not search | Press Enter with empty input | `onSearch` not called |
| 5 | Displays loading state | Search in progress | Loading indicator shown |
| 6 | Displays search results | After successful search | Result list rendered with titles, artists, thumbnails |
| 7 | Clicking result triggers selection | Click a search result | `onSelect` callback fires with selected item |
| 8 | Clears input after selection | Select a result | Input field cleared |

#### 1.3.2 RequestCard Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Renders song title | Pass request prop | Title text visible |
| 2 | Renders artist name | Pass request prop | Artist text visible |
| 3 | Renders vote count | Pass request with 5 votes | "5" displayed |
| 4 | Vote button increments | Click upvote button | `onVote` callback fires |
| 5 | Unvote button decrements | Click when already voted | `onUnvote` callback fires |
| 6 | Shows "voted" state | Guest has voted on this request | Button styled differently (filled/highlighted) |
| 7 | Song title is clickable link | Click title | Opens `source_url` in new tab (`target="_blank"`) |
| 8 | Delete button shown for sole voter | Guest is only voter | Delete/remove button visible |
| 9 | Delete button hidden for non-sole voter | Multiple voters exist | Delete button not visible |
| 10 | Delete button triggers callback | Click delete | `onDelete` callback fires with request_id and guest_id |

#### 1.3.3 RequestList Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Renders list of requests | Pass array of requests | All request cards rendered |
| 2 | Empty state message | Pass empty array | "No requests yet" message shown |
| 3 | Sorted by vote count | Requests with varying votes | Highest votes at top |
| 4 | Updates when new request added | Add request to list | New card appears in correct position |

#### 1.3.4 NamePicker Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Renders name display | Mount with generated name | Name text visible |
| 2 | Refresh generates new name | Click refresh/regenerate button | Different name displayed |
| 3 | Confirm saves name | Click confirm/continue | `onConfirm` callback fires with selected name |
| 4 | Shows on first visit (no cookie) | No guest cookie for event | NamePicker is visible |
| 5 | Hidden when cookie exists | Guest cookie present | NamePicker not rendered |

#### 1.3.5 DownloadManager Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Renders download button per request | Requests with source_url | Download icon/button shown on each |
| 2 | Single download starts | Click download on one request | Progress bar appears for that request |
| 3 | Batch download starts | Click "Download All" | Progress bars for all requests |
| 4 | Progress updates | During download | Progress percentage updates in real-time |
| 5 | Download complete state | After download finishes | Checkmark or "Downloaded" indicator |
| 6 | Download error state | Download fails | Error message shown for that request |
| 7 | Folder selector shown | No download_folder set | FolderBrowser prompt shown |

#### 1.3.6 FolderBrowser Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Renders directory listing | Mount with root path | Shows folders in the directory |
| 2 | Navigate into subfolder | Click a folder name | Lists contents of subfolder |
| 3 | Navigate up (parent) | Click back/up button | Returns to parent directory |
| 4 | Hidden directories filtered out | Folder contains `.hidden` dirs | Hidden dirs not shown |
| 5 | Select folder | Click select/confirm button | `onSelect` callback fires with path |
| 6 | Displays current path | Navigated to `/music/sets` | Path breadcrumb shows `/music/sets` |

#### 1.3.7 Toast Component

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| 1 | Shows success toast | Trigger success notification | Green toast with message appears |
| 2 | Shows error toast | Trigger error notification | Red toast with message appears |
| 3 | Auto-dismisses after timeout | Wait after toast appears | Toast fades out after configured duration |
| 4 | Manual dismiss | Click X/close button | Toast immediately removed |
| 5 | Multiple toasts stack | Trigger 3 toasts rapidly | All 3 visible, stacked vertically |

---

## 2. Integration Tests

### 2.1 Full DJ Workflow: Setup to Event Close

**Scenario:** A DJ creates an account, sets up an event, guests make requests, DJ manages and closes the event.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | DJ visits `/dj` for first time | DJ creation form shown |
| 2 | DJ enters name and submits | DJ created, ID stored in localStorage, redirected to dashboard |
| 3 | DJ clicks "Create Event" | Event form shown |
| 4 | DJ enters event name and submits | Event created, appears in event list |
| 5 | DJ clicks event to manage | Navigates to `/dj/event/:eventId`, shows event details |
| 6 | DJ copies QR code / share link | Link is `{host}/event/:eventId` |
| 7 | Guest opens event link | Guest sees `/event/:eventId`, NamePicker shown |
| 8 | Guest picks a name | Name confirmed, cookie set, request form shown |
| 9 | Guest searches for a song | YouTube results displayed |
| 10 | Guest selects a song from results | Song request created, appears in request list |
| 11 | Second guest opens same link | Second guest sees NamePicker |
| 12 | Second guest picks name and requests same song (same URL) | Duplicate merged, vote count becomes 2 |
| 13 | Second guest searches and requests a different song | New request added with 1 vote |
| 14 | First guest votes on second guest's request | Vote count increments to 2 |
| 15 | DJ sees all requests sorted by votes | Both requests visible, tied requests show correctly |
| 16 | DJ sets footer_text | Footer text appears on guest event page |
| 17 | DJ sets download folder via FolderBrowser | Folder path saved to event |
| 18 | DJ downloads a single request | Download starts, progress shown, file saved to folder |
| 19 | DJ exports CSV | CSV file downloads with all request data |
| 20 | DJ closes event | Event `is_active` set to 0 |
| 21 | Guest refreshes page | Sees EventClosed page with footer text and contact form |
| 22 | Guest submits contact form | Contact saved, confirmation shown |
| 23 | DJ navigates to Messages tab | Sees submitted contact with name, email, message |

### 2.2 Guest Cookie Persistence Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Guest A visits event 1, picks name "Cool Cat" | Cookie set for event 1 with guest ID |
| 2 | Guest A visits event 2 | NamePicker shown (different event, no cookie) |
| 3 | Guest A picks name for event 2 | Separate cookie set for event 2 |
| 4 | Guest A returns to event 1 | Recognized as "Cool Cat", no NamePicker shown |
| 5 | Guest A returns to event 2 | Recognized by event 2 name, no NamePicker shown |

### 2.3 Library Scan and Match Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | DJ scans music folder `/Users/dj/Music` | Library populated with entries (title, artist, filepath) |
| 2 | Guest requests "Bohemian Rhapsody" | Request created normally |
| 3 | DJ triggers match against library | "Bohemian Rhapsody" matches local file with confidence score |
| 4 | Match result shows filepath | DJ can see local file path without needing to download |
| 5 | Guest requests song not in library | No match found for that request |

### 2.4 Download with Per-Event Folder

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | DJ creates Event A with download folder `/music/eventA` | Folder path stored |
| 2 | DJ creates Event B with download folder `/music/eventB` | Different folder path stored |
| 3 | DJ downloads request from Event A | File saved to `/music/eventA/` |
| 4 | DJ downloads request from Event B | File saved to `/music/eventB/` |
| 5 | DJ batch downloads all from Event A | All files saved to `/music/eventA/` |

### 2.5 DJ LocalStorage Persistence

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | DJ creates account | DJ ID stored in localStorage |
| 2 | DJ closes browser and reopens `/dj` | Automatically logged in, sees dashboard with events |
| 3 | DJ clears localStorage | Next visit to `/dj` shows creation form again |

---

## 3. Regression Tests

### 3.1 Vote Merging (Duplicate Request Handling)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Same source_url merges | Guest A requests URL X, Guest B requests URL X | Single request entry, vote_count = 2, both guests recorded as voters |
| 2 | Different URLs do not merge | Guest A requests URL X, Guest B requests URL Y | Two separate request entries |
| 3 | Merge preserves original metadata | Guest A requests URL X with title "Song A", Guest B requests same URL with title "Song B" | Original title ("Song A") preserved |
| 4 | Vote count accurate after merge | 5 guests request same URL | vote_count = 5 |
| 5 | Unvote after merge | Guest B unvotes from merged request | vote_count decremented by 1, Guest B removed from voters |
| 6 | All voters unvote | All guests unvote from merged request | Request still exists with vote_count = 0, or deleted per business logic |

### 3.2 Cookie Persistence

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Cookie survives page refresh | Guest picks name, refreshes page | Same guest identity maintained |
| 2 | Cookie is per-event | Guest visits event 1 then event 2 | Separate cookies, separate identities |
| 3 | Expired cookie handling | Cookie manually deleted/expired | NamePicker shown again, new guest created |
| 4 | Cookie stores correct guest ID | Guest picks name, check cookie | Cookie value matches guest ID from API |
| 5 | Multiple events in same browser | 3 events open in 3 tabs | Each tab maintains correct event-specific guest identity |

### 3.3 Download Folder Resolution

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Absolute path works | Set folder to `/Users/dj/Music/Downloads` | Downloads saved to exact path |
| 2 | Folder with spaces in path | Set folder to `/Users/dj/My Music/Downloads` | Path handled correctly, downloads succeed |
| 3 | Folder does not exist | Set folder to `/nonexistent/path` | Error or auto-creation, depending on implementation |
| 4 | Folder permissions denied | Set folder to `/root/private` | Clear error message about permissions |
| 5 | Tilde in path | Set folder to `~/Music` | Resolved to full path `/Users/username/Music` |
| 6 | No folder set, attempt download | Download without setting folder | Prompt to set folder, or use default location |

### 3.4 Sole-Voter Delete Validation

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Sole voter can delete | Guest A creates request (sole voter), clicks delete | Request deleted, removed from list |
| 2 | Non-sole voter cannot delete | Guest A and B vote, Guest A tries delete | Delete refused (403 or button hidden) |
| 3 | Becomes sole voter after unvotes | Guest A and B vote, B unvotes, A tries delete | Delete allowed (A is now sole voter) |
| 4 | Delete removes from DB | Guest A deletes request | GET requests no longer includes it |
| 5 | Delete with invalid guest ID | DELETE `/api/requests/:id/guest/invalid-id` | 403 or 404 |
| 6 | Delete on closed event | Event closed, sole voter tries delete | 400 or 403 |

### 3.5 Rate Limiting (YouTube Search)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Under limit succeeds | 10 searches in 1 minute from same IP | All 10 return 200 |
| 2 | Over limit blocked | 11th search in same minute | 429 Too Many Requests |
| 3 | Different IPs independent | 10 from IP A, 10 from IP B | All 20 succeed |
| 4 | Limit resets after window | Wait 60 seconds after rate limit hit | Next search returns 200 |
| 5 | Rate limit response includes retry info | Hit rate limit | Response includes `Retry-After` header or message |

### 3.6 QR Code Generation

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | QR code encodes correct URL | Generate QR for event | Decoded QR matches `{host}/event/:eventId` |
| 2 | QR code renders as image | View QR on DJ page | Visible, scannable image rendered |
| 3 | QR code scannable | Scan with phone camera | Opens correct event URL in browser |

### 3.7 CSV Export

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Export includes all requests | 5 requests in event, export | CSV has 5 data rows + header |
| 2 | Export includes correct columns | Export CSV | Headers: title, artist, vote_count, source_url (at minimum) |
| 3 | Export handles special characters | Request title with commas, quotes | CSV properly escaped |
| 4 | Export empty event | No requests, export | CSV with header row only |
| 5 | Content-Type header correct | Export request | `Content-Type: text/csv` |
| 6 | Content-Disposition header | Export request | Suggests filename (e.g., `requests-eventname.csv`) |

---

## 4. Per-Page Validation Checks (320px Mobile Width)

All tests in this section should be performed with the browser viewport set to **320px width** (smallest common mobile screen) to verify responsive design.

### 4.1 GuestEvent Page (`/event/:eventId`)

| # | Check | Expected at 320px |
|---|-------|--------------------|
| 1 | Page loads without horizontal scroll | No horizontal overflow, no sideways scrollbar |
| 2 | Ghibli-style animated background renders | Background animation visible, does not obstruct content |
| 3 | Background does not cause performance issues | Smooth scrolling, no jank on low-end device simulation |
| 4 | NamePicker modal fits in viewport | Modal fully visible, not clipped or overflowing |
| 5 | NamePicker buttons are tap-target sized | Buttons at least 44x44px touch target |
| 6 | SearchBar input full width | Input stretches to available width minus padding |
| 7 | Search results list scrollable | Results list scrolls vertically if many results |
| 8 | Search result items readable | Title and artist text not truncated to unreadable length |
| 9 | Thumbnails appropriately sized | Thumbnails scaled down but still visible |
| 10 | Request list readable | Song titles, artists, vote counts all visible |
| 11 | Vote buttons tap-friendly | Vote button at least 44x44px, easy to tap without misclick |
| 12 | Song title link tappable | Link text has enough padding for accurate tapping |
| 13 | Footer text visible | DJ's footer text displayed at bottom, readable |
| 14 | Delete button accessible | For sole-voter requests, delete button reachable |
| 15 | No text overlap | All text elements maintain spacing, no overlapping |
| 16 | Font sizes readable | Minimum 14px body text (or equivalent rem) |

### 4.2 EventClosed Page

| # | Check | Expected at 320px |
|---|-------|--------------------|
| 1 | "Event Closed" message prominent | Clearly visible heading |
| 2 | Footer text displayed | DJ's custom footer text visible and readable |
| 3 | Contact form fits viewport | All form fields within 320px width |
| 4 | Input fields full width | Name, email, message fields stretch to available width |
| 5 | Message textarea usable | Textarea tall enough to type in, resizable or auto-growing |
| 6 | Submit button full width | Button spans available width for easy tapping |
| 7 | Form validation errors visible | Error messages shown below respective fields |
| 8 | Success confirmation visible | After submit, confirmation message shown clearly |
| 9 | No horizontal scroll | Page fits within 320px |

### 4.3 DJDashboard Page (`/dj`)

| # | Check | Expected at 320px |
|---|-------|--------------------|
| 1 | DJ name / header visible | DJ name shown in header or greeting |
| 2 | "Create Event" button accessible | Button visible and tappable |
| 3 | Event list readable | Event names, dates visible without truncation |
| 4 | Event cards stack vertically | Single-column layout at 320px |
| 5 | Each event card tappable | Entire card or link area is tappable |
| 6 | No horizontal overflow | Content fits within viewport |
| 7 | Messages tab accessible | Tab or navigation to messages reachable |
| 8 | Messages list readable | Contact submissions listed with name, email, message |
| 9 | DJ creation form (first visit) | Name input and submit button fit viewport |

### 4.4 EventManager Page (`/dj/event/:eventId`)

| # | Check | Expected at 320px |
|---|-------|--------------------|
| 1 | Event name displayed | Event title visible at top |
| 2 | Request list readable | All requests shown with title, artist, votes |
| 3 | Request cards stack vertically | Single-column layout |
| 4 | QR code visible and scannable | QR code image rendered at appropriate size (min 150px) |
| 5 | Share link copiable | Link displayed with copy button, both functional |
| 6 | Footer text editor accessible | Input/textarea for footer text visible and editable |
| 7 | Download folder selector accessible | FolderBrowser button/trigger reachable |
| 8 | FolderBrowser modal fits viewport | Modal or overlay fits within 320px width |
| 9 | Folder list scrollable | Long folder listings scroll vertically |
| 10 | Download buttons per request | Download icon/button tappable on each request card |
| 11 | Batch download button | "Download All" button visible and tappable |
| 12 | Download progress visible | Progress bars or percentages shown during downloads |
| 13 | CSV export button accessible | Export button visible and tappable |
| 14 | Close event button | Close/end event button visible, possibly with confirmation |
| 15 | Delete event button | Delete button accessible, confirmation dialog fits viewport |
| 16 | Library match results | Match indicators shown on requests with local library matches |
| 17 | No horizontal scroll | All content within 320px |
| 18 | Tabs/sections navigable | If tabbed layout, tabs all reachable at 320px |

---

## Test Environment Requirements

### Dependencies
- **Backend**: Node.js (v20.19+), npm, SQLite3, yt-dlp, ffmpeg
- **Frontend**: Node.js, npm, Vite, React 18+
- **Test frameworks**: Jest or Vitest (unit), Playwright or Cypress (integration/E2E), React Testing Library (components)

### Test Database
- Use an in-memory SQLite database (`:memory:`) for unit tests to ensure isolation
- Use a temporary file-based database for integration tests, wiped between test suites

### Environment Variables
- `DB_PATH=:memory:` for unit tests
- `YOUTUBE_API_KEY=test-key` (mock YouTube API responses in tests)
- `PORT=3099` (avoid conflicts with dev server)

### Mocking Strategy
- **YouTube API**: Mock all HTTP calls to `googleapis.com` with fixture responses
- **yt-dlp**: Mock subprocess calls; provide fixture audio files for download tests
- **File system**: Use a temp directory for library scan and download tests; clean up after each test
- **music-metadata**: Mock dynamic import for metadata extraction tests when actual audio files are not available

### Running Tests
```bash
# Unit tests (backend)
cd backend && npm test

# Unit tests (frontend components)
cd frontend && npm test

# Integration / E2E tests
npx playwright test

# Single test file
npx vitest run tests/routes/requests.test.js

# With coverage
npx vitest run --coverage
```
