# Playlist Proxy Setup

The browser cannot expand YouTube playlist links directly because of CORS. This optional proxy expands a playlist into video IDs using the YouTube Data API.

## 1) Create API key
1. Open Google Cloud Console.
2. Create or select a project.
3. Enable **YouTube Data API v3**.
4. Create an API key.

## 2) Configure the proxy
From the project root:

```bash
cd server
copy .env.example .env
```

Edit `.env` and set:
```
YOUTUBE_API_KEY=YOUR_KEY
```

## 3) Install and run
```bash
cd server
npm install
npm start
```

The proxy runs at `http://localhost:3001`.

## 4) Frontend uses the proxy
The dashboard calls the proxy by default at `http://localhost:3001`.

If you want a different URL, set this in the browser console:
```javascript
localStorage.setItem('cognelearn_playlist_proxy', 'https://your-proxy-url');
```

To disable expansion:
```javascript
localStorage.setItem('cognelearn_playlist_proxy', 'disabled');
```

## Notes
- The proxy caches playlist results in memory for faster repeated adds.
- If the proxy is down or the API key is missing, playlist links are stored as playlist items instead.
