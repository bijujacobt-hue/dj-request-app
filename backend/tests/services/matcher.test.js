import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, db } from '../setup.js';
import { matchRequest } from '../../services/matcher.js';
import { generateId } from '../../utils/helpers.js';

function insertTrack(djId, opts) {
  const id = generateId('lib');
  db.prepare(`
    INSERT INTO library (id, dj_id, file_path, filename, title, artist, album, duration_seconds, format, bitrate, file_size_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, djId,
    opts.file_path || `/music/${opts.filename || 'track.mp3'}`,
    opts.filename || 'track.mp3',
    opts.title || null,
    opts.artist || null,
    opts.album || null,
    opts.duration || null,
    opts.format || 'mp3',
    opts.bitrate || null,
    opts.file_size || null
  );
}

describe('matcher', () => {
  const djId = 'dj_test123';

  beforeEach(() => {
    resetDb();
    db.prepare('INSERT INTO djs (id, name) VALUES (?, ?)').run(djId, 'Test DJ');
  });

  it('finds exact title + artist match with 100% confidence', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody', artist: 'Queen', filename: 'bohemian.mp3' });
    const matches = matchRequest(djId, 'Bohemian Rhapsody', 'Queen');
    expect(matches).toHaveLength(1);
    expect(matches[0].confidence).toBe(100);
    expect(matches[0].reason).toContain('Exact');
  });

  it('matches case-insensitively', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody', artist: 'Queen', filename: 'bohemian.mp3' });
    const matches = matchRequest(djId, 'bohemian rhapsody', 'queen');
    expect(matches).toHaveLength(1);
    expect(matches[0].confidence).toBe(100);
  });

  it('strips YouTube suffixes like (Official Video)', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody', artist: 'Queen', filename: 'bohemian.mp3' });
    const matches = matchRequest(djId, 'Bohemian Rhapsody (Official Video)', 'Queen');
    expect(matches).toHaveLength(1);
    expect(matches[0].confidence).toBe(100);
  });

  it('returns partial title + artist match at 80% confidence', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody Remastered', artist: 'Queen', filename: 'bohemian-rm.mp3' });
    const matches = matchRequest(djId, 'Bohemian Rhapsody', 'Queen');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBe(80);
  });

  it('returns title-only match at 50% confidence', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody', artist: 'Cover Band', filename: 'cover.mp3' });
    const matches = matchRequest(djId, 'Bohemian Rhapsody', 'Queen');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBe(50);
  });

  it('matches filename containing title at 40% confidence', () => {
    insertTrack(djId, { title: null, artist: null, filename: 'bohemian rhapsody live.mp3' });
    const matches = matchRequest(djId, 'Bohemian Rhapsody', 'Queen');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBe(40);
  });

  it('returns no matches for nonexistent song', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody', artist: 'Queen', filename: 'bohemian.mp3' });
    const matches = matchRequest(djId, 'Nonexistent Song XYZ123', 'Unknown Artist');
    expect(matches).toHaveLength(0);
  });

  it('returns empty array for empty library', () => {
    const matches = matchRequest(djId, 'Any Song', 'Any Artist');
    expect(matches).toEqual([]);
  });

  it('returns top 3 matches sorted by confidence', () => {
    insertTrack(djId, { title: 'Blinding Lights', artist: 'The Weeknd', filename: 'bl.mp3' });
    insertTrack(djId, { title: 'Blinding Lights Remix', artist: 'The Weeknd', filename: 'bl-remix.mp3' });
    insertTrack(djId, { title: 'Blinding Lights', artist: 'Cover', filename: 'bl-cover.mp3' });
    insertTrack(djId, { title: null, artist: null, filename: 'blinding lights acoustic.mp3' });

    const matches = matchRequest(djId, 'Blinding Lights', 'The Weeknd');
    expect(matches.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
    }
  });

  it('handles request with no artist', () => {
    insertTrack(djId, { title: 'Bohemian Rhapsody', artist: 'Queen', filename: 'bohemian.mp3' });
    const matches = matchRequest(djId, 'Bohemian Rhapsody', null);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBe(50);
  });

  it('includes file metadata in match results', () => {
    insertTrack(djId, {
      title: 'Test Song', artist: 'Test Artist', album: 'Test Album',
      filename: 'test.mp3', file_path: '/music/test.mp3', duration: 200, bitrate: 320,
    });

    const matches = matchRequest(djId, 'Test Song', 'Test Artist');
    expect(matches[0]).toHaveProperty('file_path', '/music/test.mp3');
    expect(matches[0]).toHaveProperty('filename', 'test.mp3');
    expect(matches[0]).toHaveProperty('album', 'Test Album');
    expect(matches[0]).toHaveProperty('duration_seconds', 200);
    expect(matches[0]).toHaveProperty('bitrate', 320);
  });
});
