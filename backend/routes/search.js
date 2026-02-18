const express = require('express');
const router = express.Router();
const axios = require('axios');

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Simple rate limiter: max 10 searches per IP per minute
const searchCounts = new Map();
setInterval(() => searchCounts.clear(), 60000);

function rateLimit(req, res, next) {
  const ip = req.ip;
  const count = searchCounts.get(ip) || 0;
  if (count >= 10) {
    return res.status(429).json({ error: 'Too many searches. Please wait a moment.' });
  }
  searchCounts.set(ip, count + 1);
  next();
}

// GET /api/search/youtube?q=song+name - Search YouTube
router.get('/youtube', rateLimit, async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    // Search for videos
    const searchResponse = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: 'snippet',
        q: q.trim(),
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 10,
        key: apiKey
      }
    });

    const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');

    // Get video durations
    let durations = {};
    if (videoIds) {
      const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
        params: {
          part: 'contentDetails',
          id: videoIds,
          key: apiKey
        }
      });
      durations = Object.fromEntries(
        detailsResponse.data.items.map(item => [item.id, parseDuration(item.contentDetails.duration)])
      );
    }

    const results = searchResponse.data.items.map(item => ({
      id: item.id.videoId,
      title: decodeHtmlEntities(item.snippet.title),
      artist: decodeHtmlEntities(item.snippet.channelTitle),
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      duration: durations[item.id.videoId] || null,
      source: 'youtube',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    res.json({ results });
  } catch (err) {
    if (err.response?.status === 403) {
      return res.status(403).json({ error: 'YouTube API quota exceeded or key invalid' });
    }
    console.error('YouTube search error:', err.message);
    res.status(500).json({ error: 'YouTube search failed' });
  }
});

// Parse ISO 8601 duration (PT3M45S) to seconds
function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

module.exports = router;
