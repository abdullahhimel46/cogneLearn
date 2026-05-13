# cogneLearn - Adaptive Learning Platform

A privacy-first, self-guided adaptive learning platform that combines YouTube playlist management with real-time attention monitoring and Pomodoro time management—all processed locally in your browser.

## Features

✨ **Core Features:**
- 📚 **YouTube Playlist Management** - Import and organize learning playlists
- ⏱️ **Pomodoro Timer** - Integrated 25-min work + 5-min break cycles
- 👁️ **Real-Time Attention Detection** - AI-powered focus monitoring using Human.js
- 📊 **Productivity Dashboard** - Track focus time, sessions, and attention scores
- 🔒 **Privacy First** - All data stored locally in browser (localStorage)
- 🎯 **Focus Mode** - Distraction management and focus tracking

**User Dashboard:**
<img width="975" height="1039" alt="image" src="https://github.com/user-attachments/assets/b0ad27ac-8da5-43b4-b89a-506bf8421230" />

**Adding YouTube playlist:**
<img width="975" height="504" alt="image" src="https://github.com/user-attachments/assets/fa0b541e-4d45-49e3-98c1-163485012d1d" />

**Setting study plans:**
<img width="975" height="503" alt="image" src="https://github.com/user-attachments/assets/97551111-cd56-4bf2-bf2a-3d3f81296173" />

**Distraction Free Learning Environment with real-time attention detection using AI:**

<img width="624" height="582" alt="image" src="https://github.com/user-attachments/assets/7b6e4978-8e12-4eee-b9b3-7b2ee874aeb0" />


## Project Structure

```
cogneLearn/
├── index.html              # Landing page
├── css/
│   └── style.css          # Minimalist design system
├── js/
│   ├── auth.js            # Authentication & user management
│   ├── playlist.js        # Playlist management
│   ├── pomodoro.js        # Timer logic
│   └── utils.js           # Utility functions
└── pages/
    ├── login.html         # Login/Signup page
    ├── dashboard.html     # User dashboard
    └── player.html        # Study session player with timer & attention bar
```

## Getting Started

### 1. Open in Browser
Start a local server and open in your browser:

```bash
cd "d:\DIU\BLC\Defence\Phase 1"
python -m http.server 8000
```

Then open: `http://localhost:8000`

**Note:** Face-API.js models load automatically from CDN (jsDelivr) - no manual setup needed!

### 2. Create Account
- Click "Get Started" or "Sign Up"
- Enter your email, password (6+ characters), and name
- You'll be redirected to the dashboard

### 3. Add a Playlist
- Click "+ Add Playlist" on the dashboard
- Paste a YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=...`)
- Give it a name and confirm
- Click the playlist card to start studying

### 4. Study Session
- Videos from your playlist will appear in the sidebar
- Click **"Start Attention Tracking"** to enable webcam-based focus detection
- Click **"Start"** to begin the 25-minute Pomodoro cycle
- Your attention score will update in real-time (red → orange → green)
- When the timer ends, you'll complete a session and return to the dashboard

## Technology Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript

**AI/ML:** Face-API.js with Tiny Face Detector (68 facial landmarks for attention tracking)

**Data Storage:** Browser localStorage 

**Privacy:** Client-side only processing—no data sent to servers


## Key Design Principles

1. **Minimalist Design** - Clean, distraction-free interface with white/gray/teal color scheme
2. **Beginner-Friendly Logic** - Simple, readable JavaScript without complex frameworks
3. **Privacy-First** - All data stays in your browser using localStorage (proxy optional)
4. **Client-Side Processing** - ML models run entirely in the browser for attention detection
5. **Responsive** - Works on desktop and tablets

## Features Deep Dive

### Attention Detection
- Uses Face-API.js library with Tiny Face Detector for real-time face detection
- Calculates focus score based on 68 facial landmarks and head pose
- Analyzes face position, orientation, and distance from camera
- Updates attention bar in real-time while you study
- No video/image data sent to servers—all processing happens locally

**Scoring Algorithm:**
- Face position alignment (yaw): 40% weight
- Face angle (pitch): 35% weight  
- Distance from camera: 15% weight
- Face size/engagement: 10% weight

### Pomodoro Timer
- Standard 25-min work cycles + 5-min breaks
- Long 15-min break after every 4 sessions
- Visual countdown timer
- Session data stored locally

### Data Persistence
- User accounts stored in localStorage
- Playlists, videos, and session history saved locally
- Statistics tracked: total focus hours, sessions completed, average attention
- Daily focus tracking

## Limitations

- ⚠️ Attention detection accuracy depends on webcam quality and lighting
- ⚠️ Requires active internet for YouTube video streaming
- ⚠️ Playlist expansion needs the optional proxy (see PLAYLIST_PROXY_SETUP.md)
- ⚠️ "Focus Mode" (distraction blocking) suggests browser extensions only
- ⚠️ Uses pre-trained ML models; custom model training not included

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

**Note:** Requires webcam access for attention tracking feature.

## Future Enhancements

- 📱 Mobile app version
- 🔄 Backend sync for cross-device access
- 📈 Advanced analytics and visualizations
- 🤖 Custom ML model training
- 👥 Collaborative learning sessions
- 📁 Multiple account support per device

## License

© 2025 Daffodil International University - Computer Science and Engineering Department

---

**Project:** cogneLearn: A Self-Guided Adaptive Learning Platform
**Supervisor:** Md. Jahidul Alam
**Co-Supervisor:** Mehadi Hasan
**Author:** Md. Abdullah Himel (ID: 0242220005101622)
