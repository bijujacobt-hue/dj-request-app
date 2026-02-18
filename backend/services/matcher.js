const db = require('../database/db');

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function extractCoreName(str) {
  if (!str) return str;
  // Split on " | " and take first segment
  let core = str.split(' | ')[0];
  // Strip parenthetical/bracket suffixes like (Official Video), [Lyric Video], etc.
  core = core.replace(/[\(\[].*?[\)\]]/g, '').trim();
  return core;
}

function matchRequest(djId, requestTitle, requestArtist) {
  const library = db.prepare('SELECT * FROM library WHERE dj_id = ?').all(djId);

  const normTitle = normalize(requestTitle);
  const coreTitle = normalize(extractCoreName(requestTitle));
  const normArtist = normalize(requestArtist);

  const matches = [];

  for (const track of library) {
    const trackTitle = normalize(track.title);
    const trackArtist = normalize(track.artist);
    const trackFilename = normalize(track.filename);

    let confidence = 0;
    let reason = '';

    // Helper: check if title matches (full or core)
    const titleEq = (t) => t === normTitle || (coreTitle && coreTitle !== normTitle && t === coreTitle);
    const titleIncludes = (a, b) => a.includes(b) || b.includes(a);

    // 1. Exact title + artist match
    if (trackTitle && titleEq(trackTitle) && trackArtist && trackArtist === normArtist) {
      confidence = 100;
      reason = 'Exact title and artist match';
    }
    // 2. Title contains + artist match
    else if (trackTitle && trackArtist && normArtist &&
             (titleIncludes(trackTitle, normTitle) || (coreTitle && titleIncludes(trackTitle, coreTitle))) &&
             (titleIncludes(trackArtist, normArtist))) {
      confidence = 80;
      reason = 'Partial title and artist match';
    }
    // 3. Title match only
    else if (trackTitle && titleEq(trackTitle)) {
      confidence = 50;
      reason = 'Title match (no artist match)';
    }
    // 4. Filename contains title
    else if (trackFilename && normTitle &&
             (trackFilename.includes(normTitle) || (coreTitle && trackFilename.includes(coreTitle)))) {
      confidence = 40;
      reason = 'Filename contains title';
    }
    // 5. Partial title match
    else if (trackTitle && normTitle &&
             (titleIncludes(trackTitle, normTitle) || (coreTitle && coreTitle.length >= 3 && titleIncludes(trackTitle, coreTitle))) &&
             (normTitle.length >= 3 || (coreTitle && coreTitle.length >= 3))) {
      confidence = 30;
      reason = 'Partial title match';
    }

    if (confidence > 0) {
      matches.push({
        library_id: track.id,
        file_path: track.file_path,
        filename: track.filename,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration_seconds: track.duration_seconds,
        bitrate: track.bitrate,
        confidence,
        reason
      });
    }
  }

  // Sort by confidence descending, return top 3
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches.slice(0, 3);
}

module.exports = { matchRequest };
