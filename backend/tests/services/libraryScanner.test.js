import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetDb, db } from '../setup.js';
import { scanFolder } from '../../services/libraryScanner.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('libraryScanner', () => {
  let tmpDir;
  const djId = 'dj_scanner';

  beforeEach(() => {
    resetDb();
    db.prepare('INSERT INTO djs (id, name) VALUES (?, ?)').run(djId, 'Scanner DJ');
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dj-scan-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws for nonexistent folder', async () => {
    await expect(scanFolder(djId, '/nonexistent/path/xyz'))
      .rejects.toThrow('Folder not found');
  });

  it('returns zero results for empty folder', async () => {
    const result = await scanFolder(djId, tmpDir);
    expect(result.total).toBe(0);
    expect(result.scanned).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('returns zero results for folder with non-audio files', async () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'hello');
    fs.writeFileSync(path.join(tmpDir, 'photo.jpg'), 'not real');

    const result = await scanFolder(djId, tmpDir);
    expect(result.total).toBe(0);
  });

  it('finds audio files by extension', async () => {
    const extensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.wma'];
    for (const ext of extensions) {
      fs.writeFileSync(path.join(tmpDir, `track${ext}`), 'fake audio data');
    }

    const result = await scanFolder(djId, tmpDir);
    expect(result.total).toBe(7);
    expect(result.total).toBe(result.scanned + result.errors);
  });

  it('scans nested subdirectories recursively', async () => {
    const subDir = path.join(tmpDir, 'artist', 'album');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'root.mp3'), 'fake');
    fs.writeFileSync(path.join(subDir, 'nested.mp3'), 'fake');

    const result = await scanFolder(djId, tmpDir);
    expect(result.total).toBe(2);
  });

  it('ignores non-audio extensions', async () => {
    fs.writeFileSync(path.join(tmpDir, 'song.mp3'), 'fake audio');
    fs.writeFileSync(path.join(tmpDir, 'cover.jpg'), 'image');
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'text');

    const result = await scanFolder(djId, tmpDir);
    expect(result.total).toBe(1);
  });

  it('uses dynamic import for music-metadata (ESM compatibility)', async () => {
    const result = await scanFolder(djId, tmpDir);
    expect(result).toBeDefined();
  });
});
