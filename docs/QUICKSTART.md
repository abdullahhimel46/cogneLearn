# 🚀 cogneLearn - Quick Start Guide

## What You Have

A fully functional **cogneLearn: A Self-Guided Adaptive Learning Platform** built with HTML, CSS, and JavaScript. Everything is ready to use!

---

## ✨ Features Overview

| Feature | Description | Status |
|---------|-------------|--------|
| 👤 **User Authentication** | Sign up, login, logout with localStorage | ✅ Complete |
| 📚 **Playlist Management** | Add YouTube playlists, view video lists | ✅ Complete |
| ⏱️ **Pomodoro Timer** | 25-min work + 5-min breaks, customizable | ✅ Complete |
| 👁️ **Attention Detection** | Real-time AI-powered focus tracking | ✅ Complete |
| 📊 **Productivity Dashboard** | Track focus hours, sessions, attention scores | ✅ Complete |
| 🔒 **Privacy-First** | All data stored locally, no backend | ✅ Complete |
| 🎨 **Minimalist Design** | Clean UI with white/gray/teal colors | ✅ Complete |

---

## 🎯 How to Use (Step by Step)

### Step 1: Start the Server
```bash
cd "d:\DIU\BLC\Defence\Phase 1"
python -m http.server 8000
```
Then open: `http://localhost:8000`

### Step 2: Create Account
1. Click **"Get Started"** or **"Sign Up"**
2. Enter email, password (6+ chars), and name
3. Click **"Sign Up"**
4. You'll be redirected to the **Dashboard**

### Step 3: Add Your First Playlist
1. Click **"+ Add Playlist"** button
2. Paste a YouTube playlist URL:
   ```
   https://www.youtube.com/playlist?list=PLxxxxxx
   ```
3. Give it a name (e.g., "Python Basics")
4. Click **"Add Playlist"**

Optional: If you want playlist links to auto-expand into individual videos, set up the playlist proxy described in PLAYLIST_PROXY_SETUP.md.

### Step 4: Start a Study Session
1. Click on your playlist card
2. You'll see the **Player Page** with:
   - YouTube video player (top)
   - Attention bar (showing focus level)
   - Pomodoro timer (25:00)
   - Playlist sidebar (video list)

### Step 5: Track Your Focus
1. **Optional:** Click **"Start Attention Tracking"**
   - Allow camera access when prompted
   - Attention bar will show your real-time focus (0-100%)
2. Click **"Start"** to begin the 25-minute session
3. The countdown will begin
4. When it ends, you'll complete a session and get stats

### Step 6: Check Your Progress
- Return to **Dashboard**
- See updated stats:
  - Total focus hours
  - Sessions completed
  - Average attention score
  - Today's focus time

---

## 🎮 Understanding the UI

### Dashboard Stats
```
┌─────────────────────────────────────┐
│  📊 Total Focus: 5h 30m            │
│  📈 Sessions: 22                    │
│  👁️  Avg Attention: 78%            │
│  ⏱️  Today: 45m                     │
└─────────────────────────────────────┘
```

### Attention Bar Colors
```
🔴 Red (0-25%)     → Looking Away
🟠 Orange (26-60%) → Distracted
🟢 Green (61-100%) → Focused
```

### Timer Display
```
Work Time:  25:00 → 00:00 (Focus phase)
Break Time: 05:00 → 00:00 (Relax phase)
```

---

## 💡 Demo Walkthrough

**Scenario:** Learning Python

1. **Sign Up** as "jane_doe" with email "jane@example.com"
2. **Add Playlist** → Paste Python tutorial playlist URL
3. **Start Session**:
   - Enable attention tracking (click "Start Attention Tracking")
   - Click "Start" timer
   - Watch video while focus bar shows in real-time
4. **Complete 25-min session** → See stats updated
5. **Return to dashboard** → Review productivity

---

## 📱 Data Stored Locally

All data is saved in your browser's localStorage:

```javascript
// User account
localStorage.getItem('cognelearn_user')
// → {"id":"...", "email":"...", "name":"..."}

// Playlists
localStorage.getItem('cognelearn_playlists_123')
// → [{"id":"...", "name":"Python", "videos":[...]}]

// Sessions
localStorage.getItem('cognelearn_sessions_123')
// → [{"focusTime":25, "attentionScore":82, ...}]
```

**Clear all data:**
```javascript
localStorage.clear()  // Clears everything
```

---

## 🔧 Customization

### Change Colors
Edit `css/style.css`:
```css
:root {
    --primary: #0891b2;        /* Teal accent */
    --background: #ffffff;     /* White */
    --surface: #f8fafc;        /* Light gray */
}
```

### Adjust Timer Durations
Edit `js/pomodoro.js`:
```javascript
WORK_TIME: 25 * 60,         // Change to 20 * 60 for 20 mins
BREAK_TIME: 5 * 60,         // Change to 10 * 60 for 10 mins
LONG_BREAK_TIME: 15 * 60    // Change to 30 * 60 for 30 mins
```

### Modify Attention Sensitivity
Edit `pages/player.html`:
```javascript
const maxDeviation = 25;  // Degrees of head angle deviation
// Lower = stricter focus requirement
// Higher = more forgiving
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Page shows blank** | Refresh browser (Ctrl+R) |
| **Can't login after signup** | Check browser console (F12) |
| **Attention bar not working** | Allow camera access or refresh |
| **Videos not playing** | Check internet connection |
| **Data not saving** | Check if localStorage is enabled |
| **Timer not counting down** | Refresh page |

---

## 💻 Browser Requirements

✅ **Works best on:**
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

❌ **May not work on:**
- Internet Explorer (deprecated)
- Very old browser versions
- Browsers without WebGL support

---

## 🎓 Learning Resources

### Understanding the Code

**For beginners, read in this order:**

1. **`js/auth.js`** - User login/signup logic
2. **`js/playlist.js`** - How playlists are stored and managed
3. **`js/utils.js`** - Helper functions
4. **`pages/dashboard.html`** - How the dashboard works
5. **`pages/player.html`** - Study session mechanics
6. **`js/pomodoro.js`** - Timer state management

**Key Concepts:**

- `localStorage` - Client-side data storage
- `Object` - JavaScript objects for data
- `.forEach()` - Looping over arrays
- `.addEventListener()` - Handling user interactions
- Fetch/HTTP - Loading external resources (for YouTube videos)

---

## 📊 Example Workflow

```
1. Open http://localhost:8000
   ↓
2. Click "Get Started" → Sign Up Page
   ↓
3. Enter: email, password, name → Click "Sign Up"
   ↓
4. Redirected to Dashboard
   ↓
5. Click "+ Add Playlist"
   ↓
6. Paste YouTube URL → Click "Add Playlist"
   ↓
7. Click playlist card
   ↓
8. Study Session Page opens
   ↓
9. Click "Start Attention Tracking" (optional)
   ↓
10. Click "Start" timer
    ↓
11. Watch/study for 25 minutes
    ↓
12. Timer ends → Session saved → Back to dashboard
    ↓
13. Check updated stats (focus hours, sessions, etc.)
```

---

## 🔐 Privacy & Security

✅ **What's private:**
- All data stays in your browser
- No information sent to servers
- No tracking or analytics
- ML attention detection runs locally

⚠️ **What to know:**
- localStorage data is readable from browser console
- For production: use encrypted database
- Camera access is user-controlled

---

## 📝 File Reference

| File | Purpose | Size |
|------|---------|------|
| `index.html` | Landing page | 4 KB |
| `pages/login.html` | Auth page | 3 KB |
| `pages/dashboard.html` | Main dashboard | 7 KB |
| `pages/player.html` | Study session | 10 KB |
| `css/style.css` | All styling | 15 KB |
| `js/auth.js` | User management | 2 KB |
| `js/playlist.js` | Playlist logic | 4 KB |
| `js/pomodoro.js` | Timer logic | 2 KB |
| `js/utils.js` | Helper functions | 3 KB |

**Total:** ~50 KB (excluding CDN libraries)

---

## 🎯 Next Steps (After Title Defense)

1. **Add Backend** - Connect to Spring Boot/Node.js server
2. **YouTube API** - Real playlist integration
3. **Database** - Store user data persistently
4. **Mobile App** - React Native version
5. **Analytics** - Advanced charts and insights
6. **ML Training** - Custom attention detection model

---

## ❓ FAQ

**Q: Can I use this offline?**
A: Mostly yes, except YouTube videos (need internet for streaming).

**Q: Where is my data stored?**
A: In your browser's localStorage—no cloud uploads.

**Q: Can I export my data?**
A: Yes, open browser console (F12) and run:
```javascript
console.log(localStorage)
```

**Q: How do I delete my account?**
A: Click logout. To fully delete:
```javascript
localStorage.clear()
```

**Q: Can I use this on multiple devices?**
A: Not yet (data is device-specific). Will be added with backend.

**Q: Is it free?**
A: Yes! It's open source and locally hosted.

---

## 📞 Support

**Project:** cogneLearn - Adaptive Learning Platform v1.0
**For issues:** Check IMPLEMENTATION.md or README.md

---

**You're ready to go! 🚀 Open http://localhost:8000 and start learning!**
