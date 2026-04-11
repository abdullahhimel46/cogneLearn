# 🚀 Quick Start Guide - Using All Models

## ⚡ Getting Started in 30 Seconds

### Step 1: Open the Study Session
1. Go to `pages/player.html` in your browser
2. (Or navigate through the cogneLearn app to player page)

### Step 2: Start Attention Tracking
1. Click the button: **"Start Attention Tracking"**
2. Allow camera permissions when prompted
3. Don't worry - your camera feed is never sent anywhere!

### Step 3: Verify Models are Loading
Watch the browser console (F12 → Console) for logs:
```
📦 Loading face-api.js models from local folder...
  ⏳ Loading Tiny Face Detector...
  ✅ Tiny Face Detector loaded
  ⏳ Loading Face Landmarks (68 points)...
  ✅ Face Landmarks 68 loaded
  ... (more models)
  ✅ All face-api.js models loaded successfully from local folder!
```

### Step 4: See Your Attention Score
- **Focus Level Bar**: Shows real-time attention (0-100%)
- **Status Text**: Says "🎯 Highly Focused" or "👋 Looking Away"
- **Console Output**: Every 800ms shows detailed data

---

## 📊 What Each Model Does

### 🎯 Face Detection (Tiny Face Detector)
**What it does**: Finds your face in the camera
**Speed**: Super fast ⚡⚡
```
✅ Face found → Bar turns green
❌ Face not found → Bar stays at 0%
```

### 📍 Head Positioning (Face Landmarks)
**What it does**: Tracks 68 points on your face
- Eyes position
- Nose location  
- Mouth shape
- Jawline
**Use**: Calculates if you're looking at screen
```
Looking directly at screen → Face center aligned → +35 points
Looking away → Face turned → -points
```

### 😊 Expression Recognition (7 Emotions)
**What it does**: Recognizes your facial expression
- 😊 Neutral (best for studying)
- 😄 Happy (good engagement)
- 😢 Sad (might be distracted)
- 😠 Angry (frustrated?)
- 😨 Fearful (worried?)
- 🤢 Disgusted (bored?)
- 😲 Surprised (startled?)

**Check console to see**:
```
📊 Score: 85% | Expression: neutral (78%)
```

### 👤 Age & Gender (Demographics)
**What it does**: Estimates your age and gender
**Example output**:
```
Age: 28 years
Gender: Male (92% confidence)
```
**Use**: Personalized analytics and recommendations

### 🔐 Face Recognition (128D Descriptor)
**What it does**: Creates unique fingerprint of your face
**Use**: 
- Verify it's you (security)
- Track focus patterns over time
- Identify when you leave/return
**Privacy**: Only numbers stored, not your face

### 🎯 Alternative Detectors
**MTCNN**: More robust, works in challenging lighting
**SSD MobileNet**: Optimized for mobile phones

---

## 📈 Real-Time Data Display

### In Browser Console (F12):
```javascript
// Access all attention tracking data:
window.attentionTracker.lastDetection

// Returns:
{
  score: 85,                          // Attention %
  expressions: {
    neutral: 65,    happy: 25, sad: 5, angry: 3, 
    fearful: 2, disgusted: 0, surprised: 0
  },
  ageAndGender: {
    age: 28,
    gender: "male",
    genderProbability: 92              // 92% confidence
  },
  timestamp: "2024-04-05T14:30:00Z"    // When detected
}
```

### On Screen (Live):
```
┌─────────────────────────────────────┐
│ Focus Level                         │
│ ████████████████████░░░░░  85%     │
│ 🎯 Highly Focused                   │
│                                     │
│ [Stop Tracking]                     │
└─────────────────────────────────────┘
```

---

## 🎯 Attention Score Breakdown

### How the Score is Calculated:

| Component | Weight | What Affects It |
|-----------|--------|-----------------|
| **Head Angle (Yaw)** | 35% | Looking left/right vs. straight |
| **Head Tilt (Pitch)** | 30% | Looking up/down vs. level |
| **Expression** | 20% | Neutral/happy = good, sad/angry = bad |
| **Distance** | 10% | Closer to camera = more engaged |
| **Face Size** | 5% | Larger face = more involved |

### Examples:
```
Scenario 1: Perfect Study Posture
├─ Yaw: 100/100 (looking straight)
├─ Pitch: 100/100 (head level)
├─ Expression: neutral (90/100)
├─ Distance: 80/100 (good range)
└─ Face Size: 90/100 (in view)
→ Score: 92% 🎯 Highly Focused

Scenario 2: Looking Away Left
├─ Yaw: 30/100 (turned left)  ← Penalized
├─ Pitch: 80/100 (tilted)
├─ Expression: neutral (80/100)
├─ Distance: 70/100
└─ Face Size: 85/100
→ Score: 64% 👀 Focused (But should look straight!)

Scenario 3: Sad/Frustrated Expression
├─ Yaw: 90/100
├─ Pitch: 90/100
├─ Expression: sad (20/100) ← -40 penalty
├─ Distance: 75/100
└─ Face Size: 80/100
→ Score: 58% 😐 Slightly Distracted (Might need break)
```

---

## 💡 Tips for Best Results

### ✅ DO:
- **Sit straight**: Good head alignment
- **Face camera**: Look directly at screen
- **Good lighting**: Face clearly visible
- **Close distance**: Sit ~18-24 inches from camera
- **Neutral expression**: Concentrate on material
- **Comfortable**: Relax natural facial expression

### ❌ DON'T:
- Turn your head too much left/right
- Look down at desk for long periods
- Cover your face with hands
- Sit too close (face fills frame)
- Sit too far (face too small)
- Harsh shadows on face
- Backlit (light behind you in camera view)

---

## 🔄 The Tracking Loop

```
Every 800 milliseconds:

1️⃣ Camera captures frame
2️⃣ Send frame to Tiny Face Detector
3️⃣ Find face? 
   └─ Yes, continue
   └─ No, score = 0%
4️⃣ Extract landmarks (68 points)
5️⃣ Analyze expressions (7 emotions)
6️⃣ Detect age & gender
7️⃣ Calculate attention score (5 factors)
8️⃣ Update UI with score & expression
9️⃣ Store data for analytics
🔄 Repeat every 800ms
```

---

## 📱 Platform Support

| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| **Face Detection** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Landmarks** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Expressions** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Age/Gender** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Performance** | ⚡⚡ | ⚡⚡ | ⚡ (may need SSD Mobile) |
| **Camera Access** | ✅ Chrome+ | ✅ Safari+ | ⚠️ Limited browser support |

---

## 🔍 Debugging Tips

### If models don't load:

**Check 1: Browser Console**
```
F12 → Console tab
Look for error messages
```

**Check 2: Model Files**
```
Must exist: /public/models/face-api.js/
Inside folder, you should see:
- tiny_face_detector_model-*
- face_landmark_68_model-*
- face_expression_model-*
- age_gender_model-*
- face_recognition_model-*
- mtcnn_model-*
- ssd_mobilenetv1_model-*
```

**Check 3: File Path**
```
In player.html, line 100:
const MODEL_URL = '../public/models/face-api.js';

Make sure path is correct relative to player.html location
```

**Check 4: Camera Permission**
```
Browser should ask for camera permission
Check browser settings if denied
Allow camera → Try again
```

### If attention score is always 0:

1. **Check face is visible**: look at camera
2. **Check lighting**: face should be clearly lit
3. **Check distance**: sit 18-24 inches from camera
4. **Check console**: any error messages?
5. **Reload page**: try refreshing browser

### If expressions are not changing:

- That's normal for neutral/focused state
- Smile, frown, or express emotion to see change
- Check console: `Expression: neutral (95%)` means very calm

---

## 🎓 Using for Study Sessions

### Recommended Study Setup:
```
┌─────────────────────────────────────┐
│     📺 YouTube Video Above          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  👨 Your Face in Camera View        │
│  (18-24" from screen)               │
│                                     │
│  ⚡ Face clearly lit                 │
│  ⚡ Looking at screen                │
│  ⚡ Natural posture                 │
│                                     │
├─────────────────────────────────────┤
│ Focus Level:  ████████░░░░  82%    │
│ 🎯 Highly Focused                   │
│ ⏱️ Session Time: 12:34 / 25:00      │
└─────────────────────────────────────┘
```

### Analytics to Check Later:
```
Session Summary:
- Average Focus: 78%
- Peak Focus: 95%
- Times Distracted: 5 instances
- Dominant Expression: Neutral (92%)
- Session Duration: 25 minutes completed
```

---

## 🎉 You're Ready!

1. ✅ Models loaded  
2. ✅ Attention tracking working
3. ✅ Data being collected
4. ✅ Analytics ready for dashboard
5. ✅ Privacy protected (local processing)

**Happy studying!** 📚

---

## ❓ FAQ

**Q: Is my face recorded?**
A: No! Only metrics are stored. Your actual camera feed never leaves your computer.

**Q: Is internet required?**
A: No! Models are local files. Works offline.

**Q: Can I disable tracking?**
A: Yes, click "Stop Tracking" anytime.

**Q: Does it work with glasses?**
A: Yes! Works with glasses, contact lenses, etc.

**Q: What about lighting?**
A: Works best with good lighting. Avoid harsh shadows or backlighting.

**Q: Is data synced to server?**
A: Only statistics are synced. Your face data never leaves your device.

**Q: Can multiple people use it?**
A: Each person gets their own face profile and metrics.

**Q: What happens on low-power devices?**
A: May use SSD MobileNet instead of Tiny Detector. Still accurate but slightly simpler.

---

**Last Updated**: April 5, 2026  
**All Models**: ✅ Implemented & Ready
**Status**: Production Ready
