const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { generateId } = require('../utils/helpers');

// Track active downloads: requestId -> { process, progress, status }
const activeDownloads = new Map();

function startDownload(requestId, outputDir) {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  if (activeDownloads.has(requestId)) {
    const current = activeDownloads.get(requestId);
    if (current.status === 'downloading') {
      throw new Error('Download already in progress');
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');

  const args = [
    '-f', 'bestaudio',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--output', outputTemplate,
    '--newline',
    '--no-playlist',
    request.source_url
  ];

  const downloadState = {
    requestId,
    status: 'downloading',
    progress: 0,
    speed: null,
    eta: null,
    filename: null,
    error: null,
    process: null
  };

  const proc = spawn('yt-dlp', args);
  downloadState.process = proc;
  activeDownloads.set(requestId, downloadState);

  proc.stdout.on('data', (data) => {
    const line = data.toString();

    // Parse progress: [download]  45.2% of 3.50MiB at 1.23MiB/s ETA 00:02
    const progressMatch = line.match(/\[download\]\s+([\d.]+)%\s+of\s+\S+\s+at\s+(\S+)\s+ETA\s+(\S+)/);
    if (progressMatch) {
      downloadState.progress = parseFloat(progressMatch[1]);
      downloadState.speed = progressMatch[2];
      downloadState.eta = progressMatch[3];
    }

    // Parse destination filename
    const destMatch = line.match(/\[download\]\s+Destination:\s+(.+)/);
    if (destMatch) {
      downloadState.filename = destMatch[1].trim();
    }

    // Extract final filename after conversion
    const extractMatch = line.match(/\[ExtractAudio\]\s+Destination:\s+(.+)/);
    if (extractMatch) {
      downloadState.filename = extractMatch[1].trim();
    }
  });

  proc.stderr.on('data', (data) => {
    const line = data.toString();
    if (line.includes('ERROR')) {
      downloadState.error = line.trim();
    }
  });

  return new Promise((resolve, reject) => {
    proc.on('close', async (code) => {
      if (code === 0) {
        downloadState.status = 'complete';
        downloadState.progress = 100;

        // Detect quality using yt-dlp's output file
        let filePath = downloadState.filename;
        // If filename wasn't captured, try to find the mp3 in outputDir
        if (!filePath) {
          const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.mp3'));
          if (files.length > 0) {
            filePath = path.join(outputDir, files[files.length - 1]);
          }
        }

        let bitrate = null;
        let qualityLevel = 'unknown';

        if (filePath && fs.existsSync(filePath)) {
          try {
            const mm = await import('music-metadata');
            const metadata = await mm.parseFile(filePath, { duration: true });
            bitrate = metadata.format.bitrate ? Math.round(metadata.format.bitrate / 1000) : null;
            if (bitrate) {
              qualityLevel = bitrate >= 256 ? 'high' : bitrate >= 192 ? 'good' : 'low';
            }
          } catch (e) {
            // Metadata read failed, not critical
          }
        }

        // Save to database
        const downloadId = generateId('dl');
        db.prepare(
          'INSERT INTO downloads (id, request_id, file_path, quality_level, bitrate) VALUES (?, ?, ?, ?, ?)'
        ).run(downloadId, requestId, filePath, qualityLevel, bitrate);

        downloadState.filePath = filePath;
        downloadState.bitrate = bitrate;
        downloadState.qualityLevel = qualityLevel;

        resolve(downloadState);
      } else {
        downloadState.status = 'error';
        downloadState.error = downloadState.error || `yt-dlp exited with code ${code}`;
        reject(new Error(downloadState.error));
      }
    });
  });
}

function getProgress(requestId) {
  const active = activeDownloads.get(requestId);
  if (active) {
    return {
      requestId,
      status: active.status,
      progress: active.progress,
      speed: active.speed,
      eta: active.eta,
      filename: active.filename,
      filePath: active.filePath || null,
      bitrate: active.bitrate || null,
      qualityLevel: active.qualityLevel || null,
      error: active.error
    };
  }

  // Check database for completed downloads
  const download = db.prepare(
    'SELECT * FROM downloads WHERE request_id = ? ORDER BY downloaded_at DESC LIMIT 1'
  ).get(requestId);

  if (download) {
    return {
      requestId,
      status: 'complete',
      progress: 100,
      filePath: download.file_path,
      bitrate: download.bitrate,
      qualityLevel: download.quality_level,
      error: null
    };
  }

  return { requestId, status: 'not_started', progress: 0, error: null };
}

function cancelDownload(requestId) {
  const active = activeDownloads.get(requestId);
  if (!active || active.status !== 'downloading') {
    return false;
  }

  active.process.kill('SIGTERM');
  active.status = 'cancelled';
  return true;
}

module.exports = { startDownload, getProgress, cancelDownload };
