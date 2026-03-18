import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, db } from '../setup.js';
import { getProgress, cancelDownload } from '../../services/downloader.js';

describe('downloader', () => {
  beforeEach(() => {
    resetDb();
    db.prepare('INSERT INTO djs (id, name) VALUES (?, ?)').run('dj_dl', 'DL DJ');
    db.prepare('INSERT INTO events (id, dj_id, name) VALUES (?, ?, ?)').run('evt_dl', 'dj_dl', 'DL Event');
    db.prepare(`
      INSERT INTO requests (id, event_id, title, artist, source, source_url)
      VALUES ('req_dl', 'evt_dl', 'Test Song', 'Test Artist', 'youtube', 'https://youtube.com/watch?v=test')
    `).run();
  });

  describe('getProgress', () => {
    it('returns not_started for unknown request', () => {
      const progress = getProgress('req_unknown');
      expect(progress.requestId).toBe('req_unknown');
      expect(progress.status).toBe('not_started');
      expect(progress.progress).toBe(0);
      expect(progress.error).toBeNull();
    });

    it('returns complete status for downloaded tracks from DB', () => {
      db.prepare(
        'INSERT INTO downloads (id, request_id, file_path, quality_level, bitrate) VALUES (?, ?, ?, ?, ?)'
      ).run('dl_1', 'req_dl', '/music/test.mp3', 'high', 320);

      const progress = getProgress('req_dl');
      expect(progress.status).toBe('complete');
      expect(progress.progress).toBe(100);
      expect(progress.filePath).toBe('/music/test.mp3');
      expect(progress.bitrate).toBe(320);
      expect(progress.qualityLevel).toBe('high');
    });
  });

  describe('cancelDownload', () => {
    it('returns false when no active download exists', () => {
      const result = cancelDownload('req_nodownload');
      expect(result).toBe(false);
    });
  });

  describe('module exports', () => {
    it('exports startDownload, getProgress, cancelDownload', async () => {
      const downloader = await import('../../services/downloader.js');
      expect(typeof downloader.startDownload).toBe('function');
      expect(typeof downloader.getProgress).toBe('function');
      expect(typeof downloader.cancelDownload).toBe('function');
    });
  });
});
