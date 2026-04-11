# 🛠️ Model Accuracy & Stability Fixes (Technical Guide)

This document outlines the detailed steps and mathematical logic implemented to transform the **cogneLearn** attention tracking system from a jittery baseline to a professional-grade, stable monitoring solution.

---

## 📋 Table of Contents
1. [The "Before" State: Identifying Issues](#the-before-state-identifying-issues)
2. [Step 1: ML Model Upgrade (SSD MobileNet v1)](#step-1-ml-model-upgrade-ssd-mobilenet-v1)
3. [Step 2: Stable Landmark-Based Yaw estimation](#step-2-stable-landmark-based-yaw-estimation)
4. [Step 3: Calibrated Pitch Ratio Logic](#step-3-calibrated-pitch-ratio-logic)
5. [Step 4: Expression Scoring Refactor](#step-4-expression-scoring-refactor)
6. [Step 5: Temporal Smoothing & Fallbacks](#step-5-temporal-smoothing--fallbacks)

---

## 📉 The "Before" State: Identifying Issues

The original algorithm relied on **Face Bounding Box** coordinates. Because the AI detector's box shifts by several pixels in every frame due to lighting and minor camera noise, the "center" of the face was constantly jumping. 

*   **Result**: The math interpreted these jumps as the user turning their head, causing the score to drop to 20-30% even while the user was staring at the screen.
*   **Math Bug**: A scaling error in the `expressionScore` caused it to jump between 0 and 100% abruptly instead of being a smooth contributor.

---

## 🚀 Step 1: ML Model Upgrade (SSD MobileNet v1)

Switching from the **TinyFaceDetector** to **SSD MobileNet v1** was the first priority.

*   **Implementation**: Updated `player.html` to load `ssdMobilenetv1` by default.
*   **Benefit**: This model provides significantly higher precision for the **68-point facial landmarks**. This ensures the "anchor points" used for our math are fixed and reliable.

---

## ⚖️ Step 2: Stable Landmark-Based Yaw Estimation

Instead of using the bounding box center, we now use **Internal Facial Geometry**.

*   **Logic**: No matter where the face box is on the screen, the **midpoint of your eyes** and the **bridge of your nose** are fixed relative to each other.
*   **Calculation**:
    ```javascript
    const eyeMidpointX = (leftEye[0].x + rightEye[3].x) / 2;
    const noseTipX = nose[3].x;
    const yawOffset = Math.abs(noseTipX - eyeMidpointX);
    ```
*   **Improvement**: This "Internal Anchor" is immune to bounding box jitter. If the box moves, both the eye and nose points move together, keeping the offset stable.

---

## 📐 Step 3: Calibrated Pitch Ratio Logic

The old "Pitch" math assumed human eyes are always at exactly 50% of the face height. In reality, the natural eye line is higher up (~40%). 

*   **New Logic**: Used a **Pitch Ratio** instead of a coordinate offset.
*   **Formula**:
    ```javascript
    const eyeToNoseDist = noseTipY - eyeLineY;
    const faceHeight = jawBottomY - eyeLineY;
    const currentPitchRatio = eyeToNoseDist / faceHeight;
    ```
*   **Calibration**: Set the "Ideal Pitch" to **0.35**. This corresponds to a standard sitting posture. Deviation from this ratio now accurately reflects head tilt rather than just sitting naturally.

---

## 😊 Step 4: Expression Scoring Refactor

Fixed the critical math bug where scores were being rounded too early.

*   **Old Code**: `Math.round(fraction) * 100` — This basically made the expression score a binary "Yes/No" switch.
*   **New Code**:
    ```javascript
    expressionScore = (
        (expr.neutral * 100) + 
        (expr.happy * 80) + 
        (expr.surprised * 50) + 
        (Math.max(expr.sad, expr.angry) * -60)
    );
    ```
*   **Benefit**: Your "Mental State" now contributes linearly. A slight "Sad" or "Angry" expression won't crash your entire attention score, but will gently nudge it down.

---

## 🔄 Step 5: Temporal Smoothing & Fallbacks

Finally, we improved the "Behavior" of the score display.

1.  **Buffer Increase**: Increased the moving average buffer from **5 to 10 samples**. This filters out eye blinks and micro-fidgets, making the green/yellow/red bar much more stable.
2.  **Detection Interval**: Set to **1500ms**. This provides enough time for the high-accuracy SSD model to process without lagging the YouTube video playback.
3.  **Fail-safe Fallback**: If the browser/device cannot load the high-accuracy SSD model for any reason, the system **automatically falls back** to the TinyFaceDetector, ensuring tracking always starts.

---

**Status**: ✅ IMPLEMENTED & VERIFIED
**Primary Files**: `js/AttentionMonitor.js`, `pages/player.html`
