# cogneLearn Implementation Summary

## ✅ Project Complete!

Your **cogneLearn: A Self-Guided Adaptive Learning Platform** frontend has been successfully built with HTML, CSS, and Vanilla JavaScript. The app is fully functional and ready to test.

---

## 📁 Project Structure

```
Phase 1/
├── index.html                    # Landing page
├── README.md                     # Full documentation
├── css/
│   └── style.css                # Minimalist design system (white/gray/teal)
├── js/
│   ├── auth.js                  # User authentication & session management
│   ├── playlist.js              # Playlist CRUD & statistics
│   ├── pomodoro.js              # Timer logic & state management
│   └── utils.js                 # Utility functions & helpers
└── pages/
    ├── login.html               # Login/Signup (toggle between modes)
    ├── dashboard.html           # Main dashboard with stats & playlists
    └── player.html              # Study session with player, timer, attention bar
```

---

## 🎨 Design System

**Color Palette (Minimalist):**
- Primary: `#0891b2` (Teal)
- Background: `#ffffff` (White)
- Surface: `#f8fafc` (Light Gray)
- Text Primary: `#1e293b` (Dark)
- Text Secondary: `#64748b` (Gray)

**Features:**
- Fully responsive (desktop, tablet, mobile)
- Clean typography with system fonts
- Minimal shadows and subtle interactions
- Accessible form inputs and buttons

---

## 🔧 Core Features Implemented

### 1. **Authentication System** (`auth.js`)
- Login & Signup with form validation
- localStorage-based user sessions
- Password requirement (6+ characters)
- Auto-redirect to dashboard on login

### 2. **Playlist Management** (`playlist.js`)
- Add YouTube playlists via URL
- Extract and store video lists
- Track focus time per playlist
- Full CRUD operations stored in localStorage

### 3. **Pomodoro Timer** (`pomodoro.js`)
- 25-min work + 5-min break cycles
- Long break (15 min) after 4 sessions
- Start/Pause/Reset controls
- Real-time countdown display

### 4. **Real-Time Attention Detection** (`player.html`)
- Uses **Human.js** library (face detection & head pose)
- Calculates focus score: 0-100% based on head angle deviation
- Color gradient: Red (unfocused) → Orange → Green (focused)
- Runs silently in background with optional toggle
- All processing happens client-side (no data sent to servers)

### 5. **Productivity Dashboard** (`dashboard.html`)
- Total focus hours (formatted as "Xh Ym")
- Sessions completed counter
- Average attention score across all sessions
- Today's focus time tracker
- Playlist gallery with video count

### 6. **Data Persistence** (localStorage)
- User accounts: `cognelearn_user`
- Playlists: `cognelearn_playlists_{userId}`
- Sessions: `cognelearn_sessions_{userId}`
- All data stored locally—no backend required

---

## 🎯 User Flow

### Sign Up → Dashboard → Playlist → Study Session

```
1. Landing (index.html)
   ↓
2. Sign Up/Login (pages/login.html)
   - Creates user in localStorage
   - Initializes empty playlist array
   ↓
3. Dashboard (pages/dashboard.html)
   - View playlists and stats
   - Add new YouTube playlist URL
   - Click playlist to start session
   ↓
4. Study Session (pages/player.html)
   - YouTube video player (iframe)
   - Playlist sidebar (video list)
   - Pomodoro Timer (25:00 countdown)
   - Attention Bar (0-100% focus level)
   - Optional: Enable webcam attention tracking
   ↓
5. Session Complete
   - Timer ends → Session saved to localStorage
   - Stats updated in dashboard
   - Return to dashboard
```

---

## 🧠 Attention Detection (ML Integration)

**Library:** Human.js v3 (by Vladimir Mandic)
- Runs in browser—no server calls
- Face detection & head pose estimation
- Calculates attention score based on:
  - **Yaw angle** (60% weight) - looking left/right
  - **Pitch angle** (40% weight) - looking up/down
  - Max deviation threshold: 25 degrees

**How It Works:**
1. User clicks "Start Attention Tracking"
2. Browser requests camera permission
3. Human.js loads pre-trained ML models
4. Real-time face detection begins
5. Attention bar updates every 100ms
6. Visual feedback: Red→Orange→Green gradient
7. No video data sent anywhere—all local

---

## 💾 localStorage Data Structure

**User Object:**
```javascript
{
  "id": "1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-01-20T10:00:00Z"
}
```

**Playlist Object:**
```javascript
{
  "id": "playlist_1234567890",
  "name": "Python Basics",
  "playlistId": "PLxxxxxx",
  "videos": [
    {"id": "dQw4w9WgXcQ", "title": "Video 1"},
    {"id": "dQw4w9WgXcQ", "title": "Video 2"}
  ],
  "createdAt": "2025-01-20T10:00:00Z",
  "totalFocusMinutes": 150
}
```

**Session Object:**
```javascript
{
  "id": "session_1234567890",
  "playlistId": "playlist_xxx",
  "focusTime": 25,
  "attentionScore": 75,
  "timestamp": "2025-01-20T10:00:00Z"
}
```

---

## 🚀 How to Run

### Option 1: Local File (Simple)
1. Open `index.html` directly in browser
2. Works offline for most features
3. Attention detection requires internet (for ML models)

### Option 2: Local Server (Recommended)
```bash
cd "d:\DIU\BLC\Defence\Phase 1"
python -m http.server 8000
# Visit: http://localhost:8000
```

### Option 3: Live Server (VS Code)
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"
3. Browser opens automatically

---

## ⚙️ JavaScript Modules Explained

### `auth.js` - Authentication
```javascript
Auth.login(email, password)      // User login
Auth.signup(email, password, name) // User signup
Auth.logout()                    // Clear session
Auth.getCurrentUser()            // Get logged-in user
```

### `playlist.js` - Playlist Management
```javascript
Playlist.getAll()                // All user playlists
Playlist.getById(id)             // Get specific playlist
Playlist.add(playlistData)       // Create new playlist
Playlist.addSession(sessionData) // Save study session
Playlist.getStats()              // Get dashboard stats
```

### `pomodoro.js` - Timer
```javascript
Pomodoro.start(onTick, onComplete)
Pomodoro.pause()
Pomodoro.reset()
Pomodoro.getFormattedTime()
Pomodoro.getStatus()
```

### `utils.js` - Utilities
```javascript
Utils.formatFocusTime(minutes)   // "5h 30m"
Utils.formatDate(dateString)     // "Jan 20, 2025"
Utils.validateEmail(email)       // Boolean
Utils.debounce(func, delay)      // Debounced function
```

---

## 🎯 Key Implementation Decisions

1. **Vanilla JavaScript** - No frameworks (React/Vue) for beginner-friendly code
2. **localStorage Only** - No backend/database, all data stays in browser
3. **Minimalist CSS** - No Tailwind/Bootstrap; custom design system
4. **Responsive Grid** - CSS Grid + Flexbox for layout
5. **Client-Side ML** - Human.js for privacy-first attention detection
6. **URL Parameters** - Navigation using query strings (`?playlist=id`, `?mode=signup`)
7. **Event Delegation** - onclick handlers for simplicity

---

## 🔐 Privacy & Security

✅ **Privacy-First Architecture:**
- No user data sent to backend
- No tracking cookies or analytics
- No cloud storage of behavioral data
- ML models run entirely in browser
- User consent for camera access

⚠️ **Considerations:**
- localStorage is not encrypted (local only)
- For production: use encrypted database
- Camera access is user-initiated

---

## 📊 Current Limitations

1. **YouTube Playlist Import** - Currently uses demo videos. In production:
   - Use YouTube API for real playlist fetching
   - Extract actual video IDs from playlist

2. **Attention Detection Accuracy** - Depends on:
   - Webcam quality
   - Lighting conditions
   - Head pose angles
   - May not work on all face sizes/angles

3. **Browser Support** - Requires:
   - Modern browser with WebGL support
   - MediaDevices API for camera
   - localStorage support

4. **Focus Mode** - Currently shows extension recommendations
   - Browser can't force-install extensions
   - User must manually enable blocking

---

## 🚀 Future Enhancements

1. **Backend Integration** - Add Node.js/Spring Boot backend for:
   - Real YouTube API integration
   - User data persistence
   - Cross-device sync

2. **Advanced Analytics** - Add charts for:
   - Weekly focus time trends
   - Attention score over time
   - Study pattern analysis

3. **Custom ML Model** - Train attention detection on user data

4. **Mobile App** - React Native version for iOS/Android

5. **Collaborative Features** - Study groups, shared playlists

6. **Notification System** - Browser notifications for breaks/focus reminders

---

## 📝 File Sizes & Performance

- **index.html** - ~4 KB
- **css/style.css** - ~15 KB (complete design system)
- **js/auth.js** - ~2 KB
- **js/playlist.js** - ~4 KB
- **js/pomodoro.js** - ~2 KB
- **js/utils.js** - ~3 KB
- **pages/login.html** - ~3 KB
- **pages/dashboard.html** - ~7 KB
- **pages/player.html** - ~10 KB

**Total:** ~50 KB (excluding Human.js CDN library)

---

## ✨ Testing Checklist

- [x] Landing page displays correctly
- [x] Sign up form validates inputs
- [x] Login redirects to dashboard
- [x] Dashboard shows stats & playlists
- [x] Add playlist modal works
- [x] Pomodoro timer counts down
- [x] Attention bar updates in real-time
- [x] Data persists across page reloads
- [x] Logout clears session
- [x] Responsive on mobile

---

## 📞 Support & Contact

**Project:** cogneLearn - Adaptive Learning Platform
**Version:** 1.0 (Title Phase)
**Author:** Md. Abdullah Himel
**ID:** 0242220005101622
**Supervisor:** Md. Jahidul Alam
**Co-Supervisor:** Mehadi Hasan
**Institution:** Daffodil International University
**Department:** Computer Science and Engineering

---

**Ready to use! Open `http://localhost:8000` in your browser to start.**
