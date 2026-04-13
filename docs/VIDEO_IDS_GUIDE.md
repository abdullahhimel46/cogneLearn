# 📺 How to Get YouTube Video IDs for cogneLearn

## What is a YouTube Video ID?

A YouTube video ID is an 11-character unique identifier for each video. It looks like this:
```
jNQXAC9IVRw
dQw4w9WgXcQ
M7lc1BCxL00
```

---

## 3 Ways to Find Video IDs

### Method 1: From URL (Easiest)
When you're on a YouTube video page, look at the URL:
```
https://www.youtube.com/watch?v=jNQXAC9IVRw
                               ↑ Video ID
```

Copy the part after `v=` (11 characters)

### Method 2: From Playlist Page
On a YouTube playlist page, click a video. The URL will show:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxxxxx
```

Copy the video ID part: `dQw4w9WgXcQ`

### Method 3: Using Browser Console
On any YouTube page, paste this code in the browser console (F12):
```javascript
// Gets current video ID
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams.get('v'));
```

---

## Sample Working Video IDs

You can use these to test:

| Video | ID | Channel |
|-------|----|---------| 
| Me at the zoo (1st YouTube video) | `jNQXAC9IVRw` | Jawed Videos |
| Rick Astley - Never Gonna Give You Up | `dQw4w9WgXcQ` | Rick Astley |
| Python Tutorial - Full Course | `M7lc1BCxL00` | Programming with Mosh |

---

## How to Add Videos to cogneLearn

### Step 1: Go to Dashboard
Click on "Dashboard" in the top menu

### Step 2: Click "+ Add Playlist"
A modal will appear

### Step 3: Enter Playlist Name
Example: "Python Basics"

### Step 4: Paste Video IDs
Paste YouTube video IDs, one per line:
```
jNQXAC9IVRw
dQw4w9WgXcQ
M7lc1BCxL00
```

### Step 5: Click "Add Playlist"
Your playlist will be created instantly!

### Step 6: Click Your Playlist
Start your study session

---

## Validation Rules

✅ **Valid video IDs:**
- Exactly 11 characters
- Contains letters, numbers, dashes (-), underscores (_)
- Examples: `jNQXAC9IVRw`, `dQw4w9WgXcQ`, `M7lc1BCxL00`

❌ **Invalid video IDs:**
- Too short: `jNQX` (4 chars)
- Too long: `jNQXAC9IVRwXXX` (14 chars)
- Special characters: `jNQXAC9IVRw!` (contains !)
- Spaces: `jNQX AC9IVRw` (contains space)

---

## Tips for Finding Good Learning Videos

### Popular Learning Channels

| Channel | Topic | Search |
|---------|-------|--------|
| **Traversy Media** | Web Development | "traversy media" on YouTube |
| **Programming with Mosh** | Programming | "programming with mosh" on YouTube |
| **freeCodeCamp** | Computer Science | "freecodecamp" on YouTube |
| **3Blue1Brown** | Math/Algorithms | "3blue1brown" on YouTube |
| **MIT OpenCourseWare** | University Courses | "MIT opencourseware" on YouTube |

### How to Find Videos

1. Search on YouTube
2. Find a video you want
3. Click on it
4. Copy the ID from the URL
5. Paste into cogneLearn

---

## Example Workflow

**Scenario: Learning Python**

1. Search YouTube for "Python for beginners"
2. Find videos you like
3. Note down their IDs:
   - `dQw4w9WgXcQ` (Intro)
   - `M7lc1BCxL00` (Variables)
   - `jNQXAC9IVRw` (Functions)

4. Go to cogneLearn Dashboard
5. Click "+ Add Playlist"
6. Enter name: "Python for Beginners"
7. Paste IDs:
   ```
   dQw4w9WgXcQ
   M7lc1BCxL00
   jNQXAC9IVRw
   ```
8. Click "Add Playlist"
9. Start learning! 🚀

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Invalid video IDs" error** | Make sure each ID is exactly 11 characters |
| **Video won't play** | Video might be restricted or removed from YouTube |
| **No audio** | Check YouTube video permissions |
| **Video says unavailable** | Video might be private or deleted |

---

## Browser Compatibility

✅ All major browsers support YouTube embedding:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**Need Help?**
Check the QUICKSTART.md guide or refer to the README.md for more information about cogneLearn.
