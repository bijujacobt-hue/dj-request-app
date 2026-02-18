const crypto = require('crypto');

function generateId(prefix) {
  const id = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  return prefix ? `${prefix}_${id}` : id;
}

module.exports = { generateId };
