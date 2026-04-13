import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const apiKey = process.env.YOUTUBE_API_KEY || '';
const cacheTtlMs = Number(process.env.PLAYLIST_CACHE_TTL_MS || 10 * 60 * 1000);

const cache = new Map();

function getCachedPlaylist(playlistId) {
  const entry = cache.get(playlistId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > cacheTtlMs) {
    cache.delete(playlistId);
    return null;
  }
  return entry;
}

function setCachedPlaylist(playlistId, videoIds) {
  cache.set(playlistId, {
    timestamp: Date.now(),
    videoIds: Array.isArray(videoIds) ? videoIds : []
  });
}

async function fetchPlaylistVideoIds(playlistId) {
  if (!apiKey) {
    throw new Error('Missing YOUTUBE_API_KEY');
  }

  const videoIds = [];
  let pageToken = '';

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('key', apiKey);
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach(item => {
      const id = item?.contentDetails?.videoId;
      if (id) videoIds.push(id);
    });

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return videoIds;
}

app.use(cors());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/playlist', async (req, res) => {
  const playlistId = req.query.playlistId || req.query.list;
  if (!playlistId) {
    res.status(400).json({ error: 'Missing playlistId' });
    return;
  }

  const cached = getCachedPlaylist(playlistId);
  if (cached) {
    res.json({ playlistId, videoIds: cached.videoIds, cached: true });
    return;
  }

  try {
    const videoIds = await fetchPlaylistVideoIds(String(playlistId));
    setCachedPlaylist(playlistId, videoIds);
    res.json({ playlistId, videoIds, cached: false });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch playlist',
      details: error?.message || 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Playlist proxy running on http://localhost:${port}`);
});
