# 🧪 Testing Face-API.js Integration

## ✅ Quick Test Checklist

### Step 1: Download Models
- [ ] Open `download-models.html` in browser
- [ ] Download all 4 model files
- [ ] Create `models/` folder in project root
- [ ] Move all 4 files to `models/` folder

### Step 2: Start Server
```bash
cd "d:\DIU\BLC\Defence\Phase 1"
python -m http.server 8000
```
- [ ] Server started successfully
- [ ] Open `http://localhost:8000`

### Step 3: Login & Setup
- [ ] Create account or login
- [ ] Add a test playlist with video IDs
- [ ] Click playlist to enter player page

### Step 4: Test Attention Tracking
- [ ] Click "Start Attention Tracking" button
- [ ] Allow camera access when prompted
- [ ] Wait for initialization (2-5 seconds)

**Expected Console Output:**
```
📦 Loading face-api.js models...
✅ Face-API.js models loaded successfully
📷 Requesting camera access...
✅ Attention tracking started
```

### Step 5: Verify Detection
Position yourself in front of camera and check:

| Action | Expected Score | Status |
|--------|---------------|--------|
| **Looking straight at camera** | 80-100% | 🎯 Highly Focused |
| **Slight tilt (10-15°)** | 60-79% | 👀 Focused |
| **Looking to side (20-30°)** | 40-59% | 😐 Slightly Distracted |
| **Looking away (>30°)** | 0-39% | 👋 Looking Away |
| **No face visible** | 0% | ❌ No Face Detected |

---

## 🔬 Detailed Testing

### Test 1: Model Loading
```javascript
// Open browser console (F12) and check:
console.log(faceapi.nets.tinyFaceDetector.isLoaded); // Should be true
console.log(faceapi.nets.faceLandmark68Net.isLoaded); // Should be true
```

### Test 2: Camera Stream
```javascript
// Check if video stream is active:
console.log(window.attentionTracker.stream); // Should show MediaStream
console.log(window.attentionTracker.video.readyState); // Should be 4 (HAVE_ENOUGH_DATA)
```

### Test 3: Detection Loop
```javascript
// Monitor detection in real-time:
// Console should log attention scores every 800ms when face is detected
```

### Test 4: Attention Calculation
Test different head positions:

```
🧪 Test Case 1: Centered Face
Expected: Score 85-100%
Landmarks: Eyes aligned, nose centered, face forward

🧪 Test Case 2: Tilted Head (15° left)
Expected: Score 65-80%
Landmarks: Eye positions offset, nose slightly left

🧪 Test Case 3: Looking Down (20°)
Expected: Score 50-65%
Landmarks: Eyes lower, jawline visible

🧪 Test Case 4: Looking Away
Expected: Score 0-40%
Landmarks: Face profile, one eye hidden

🧪 Test Case 5: No Face
Expected: Score 0%
Status: "❌ No Face Detected"
```

---

## 🐛 Debugging Common Issues

### Issue 1: Models Not Loading
**Symptoms:**
- Error: "Failed to load models"
- Console shows 404 errors

**Fix:**
1. Check folder structure:
   ```
   Phase 1/
   └── models/
       ├── tiny_face_detector_model-weights_manifest.json
       ├── tiny_face_detector_model-shard1
       ├── face_landmark_68_model-weights_manifest.json
       └── face_landmark_68_model-shard1
   ```
2. Verify file names exactly match (case-sensitive)
3. Ensure server is running from `Phase 1/` root
4. Check network tab in DevTools for 404s

### Issue 2: Camera Access Denied
**Symptoms:**
- Alert: "Could not access camera"
- No video stream

**Fix:**
1. Check browser permissions (click lock icon in address bar)
2. Ensure HTTPS or localhost (required for camera)
3. Close other apps using camera (Zoom, Skype, etc.)
4. Try different browser (Chrome recommended)

### Issue 3: Detection Not Working
**Symptoms:**
- Score always 0%
- No detection updates

**Fix:**
1. Check lighting (need decent light on face)
2. Position face in front of camera
3. Wait 2-3 seconds after clicking "Start Tracking"
4. Check console for errors
5. Try refreshing page and restarting tracking

### Issue 4: Slow Performance
**Symptoms:**
- Laggy UI
- Detection delayed

**Fix:**
1. Already optimized (800ms interval, 224px input size)
2. Close other tabs/apps
3. Ensure decent GPU/CPU
4. Lower video resolution (already set to 640x480)

### Issue 5: Inaccurate Scores
**Symptoms:**
- Score doesn't match actual attention
- Fluctuating wildly

**Tuning Options:**

Edit `AttentionMonitor.js` line 52-65:
```javascript
// Current weights:
yawScore * 0.40 +      // Horizontal (left/right) - most important
pitchScore * 0.35 +    // Vertical (up/down)
depthScore * 0.15 +    // Distance from camera
sizeScore * 0.10       // Face size

// To make it more sensitive to left/right turns:
yawScore * 0.50 +
pitchScore * 0.30 +
depthScore * 0.15 +
sizeScore * 0.05

// To make it more forgiving:
yawScore * 0.30 +
pitchScore * 0.25 +
depthScore * 0.25 +
sizeScore * 0.20
```

---

## 📊 Performance Benchmarks

### Expected Performance:
- **Model Load Time:** 2-5 seconds (first time)
- **Detection Interval:** 800ms per frame
- **Frame Processing:** 50-100ms per detection
- **Memory Usage:** ~50-100 MB
- **CPU Usage:** 5-15% (lightweight)

### Browser Compatibility:
| Browser | Support | Performance |
|---------|---------|-------------|
| Chrome 90+ | ✅ Excellent | Fast |
| Firefox 88+ | ✅ Good | Medium |
| Edge 90+ | ✅ Excellent | Fast |
| Safari 14+ | ⚠️ Limited | Slow |
| Mobile | ❌ Not optimized | N/A |

---

## 🎯 Defense Demo Script

### For Title Defense:

**1. Show Model Setup (30 seconds)**
```
"I've integrated face-api.js with Tiny Face Detector 
for real-time attention monitoring. The models are loaded 
locally for privacy and performance."
```

**2. Demonstrate Detection (60 seconds)**
```
- Start tracking
- Show different head positions
- Explain scoring algorithm
- Highlight real-time updates
```

**3. Explain Privacy (30 seconds)**
```
"All processing happens client-side in the browser. 
No video data is sent to any server. The ML models 
run entirely on the user's device using TensorFlow.js 
backend via face-api.js."
```

**4. Show Technical Details (60 seconds)**
```
- Open console to show model loading
- Demonstrate 68 facial landmarks
- Explain attention calculation weights
- Show AttentionMonitor.js code
```

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________

✅ Models Downloaded: YES / NO
✅ Server Started: YES / NO
✅ Camera Access: YES / NO
✅ Models Loaded: YES / NO
✅ Detection Working: YES / NO

Attention Scores:
- Looking straight: _____% (expected: 80-100%)
- Slight tilt: _____% (expected: 60-79%)
- Looking away: _____% (expected: 0-39%)
- No face: _____% (expected: 0%)

Performance:
- Model load time: _____ seconds
- Detection lag: _____ ms
- Browser: _______________

Issues Found:
______________________________
______________________________
______________________________

Overall Rating: ⭐⭐⭐⭐⭐
```

---

## 🔥 Advanced Testing

### Test Facial Landmarks
Add this to player.html temporarily to visualize landmarks:

```javascript
// After detection in detectAttention() function:
if (detection) {
    const canvas = document.createElement('canvas');
    const displaySize = { width: 640, height: 480 };
    faceapi.matchDimensions(canvas, displaySize);
    const resizedDetection = faceapi.resizeResults(detection, displaySize);
    faceapi.draw.drawDetections(canvas, resizedDetection);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
    document.body.appendChild(canvas); // Shows landmarks overlay
}
```

### Measure Detection Accuracy
```javascript
let detectionTests = [];

setInterval(() => {
    const score = window.attentionTracker.currentScore;
    detectionTests.push({
        timestamp: Date.now(),
        score: score,
        expected: 80 // Your actual attention level
    });
}, 1000);

// After 30 seconds:
setTimeout(() => {
    const avg = detectionTests.reduce((a, b) => a + b.score, 0) / detectionTests.length;
    console.log(`Average Score: ${avg}%`);
    console.log(`Variance: ${Math.max(...detectionTests.map(t => t.score)) - Math.min(...detectionTests.map(t => t.score))}`);
}, 30000);
```

---

## ✅ Final Checklist for Defense

Before your defense, ensure:

- [ ] All 4 model files present in `/models` folder
- [ ] Models load without errors
- [ ] Camera permissions granted
- [ ] Detection works smoothly (80ms-100ms per frame)
- [ ] Attention scores are accurate (±10% margin)
- [ ] UI updates in real-time
- [ ] Can explain the algorithm clearly
- [ ] Console shows no errors
- [ ] Tested in Chrome (recommended browser)
- [ ] Backup: Know how to debug if something fails

---

**You're ready! 🚀**
