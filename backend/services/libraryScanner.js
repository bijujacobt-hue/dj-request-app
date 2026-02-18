const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const { generateId } = require('../utils/helpers');

const SUPPORTED_FORMATS = new Set(['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.wma']);

function getAudioFiles(dirPath, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAudioFiles(fullPath, files);
    } else if (SUPPORTED_FORMATS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function scanFolder(djId, folderPath) {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder not found: ${folderPath}`);
  }

  const mm = await import('music-metadata');
  const audioFiles = getAudioFiles(folderPath);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO library (id, dj_id, file_path, filename, title, artist, album, duration_seconds, format, bitrate, file_size_bytes, last_scanned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  // Check for existing entries to reuse IDs
  const getExisting = db.prepare('SELECT id FROM library WHERE dj_id = ? AND file_path = ?');

  let scanned = 0;
  let errors = 0;

  for (const filePath of audioFiles) {
    try {
      const metadata = await mm.parseFile(filePath, { duration: true });
      const stats = fs.statSync(filePath);
      const filename = path.basename(filePath);
      const ext = path.extname(filePath).replace('.', '');

      const existing = getExisting.get(djId, filePath);
      const id = existing ? existing.id : generateId('lib');

      insertStmt.run(
        id,
        djId,
        filePath,
        filename,
        metadata.common.title || null,
        metadata.common.artist || null,
        metadata.common.album || null,
        metadata.format.duration ? Math.round(metadata.format.duration) : null,
        ext,
        metadata.format.bitrate ? Math.round(metadata.format.bitrate / 1000) : null,
        stats.size
      );
      scanned++;
    } catch (err) {
      errors++;
    }
  }

  return { total: audioFiles.length, scanned, errors };
}

module.exports = { scanFolder };
