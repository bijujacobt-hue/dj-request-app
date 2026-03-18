const crypto = require('crypto');
const path = require('path');
const os = require('os');

function generateId(prefix) {
  const id = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  return prefix ? `${prefix}_${id}` : id;
}

// --- Input validation helpers ---

const LIMITS = {
  name: 200,
  title: 500,
  artist: 300,
  source_url: 2000,
  thumbnail_url: 2000,
  footer_text: 500,
  message: 2000,
  contact_info: 300,
  search_query: 200,
  folder_path: 1000,
  batch_size: 50,
};

function validateString(value, fieldName, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const limit = maxLength || LIMITS[fieldName] || 500;
  return trimmed.length > limit ? trimmed.substring(0, limit) : trimmed;
}

function requireString(value, fieldName, maxLength) {
  const cleaned = validateString(value, fieldName, maxLength);
  if (!cleaned) return { error: `${fieldName} is required` };
  return { value: cleaned };
}

function validateUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (trimmed.length > LIMITS.source_url) return null;
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return trimmed;
  } catch {
    return null;
  }
}

function validateDuration(value) {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 86400) return null;
  return Math.round(num);
}

function safePath(userPath) {
  if (!userPath || typeof userPath !== 'string') return null;
  const trimmed = userPath.trim();
  if (trimmed.length > LIMITS.folder_path) return null;
  const resolved = path.resolve(trimmed);
  const home = os.homedir();
  // Allow paths under home directory, /tmp, /Volumes, or common music dirs
  const allowed = [home, '/tmp', '/Volumes', '/Users', '/media', '/mnt'];
  if (!allowed.some(prefix => resolved.startsWith(prefix))) return null;
  return resolved;
}

module.exports = {
  generateId,
  LIMITS,
  validateString,
  requireString,
  validateUrl,
  validateDuration,
  safePath,
};
