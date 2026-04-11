/**
 * AttentionMonitor Module - Tracks and monitors user attention levels
 * Enhanced with full face-api.js model suite (expressions, age, gender, etc.)
 */
const AttentionMonitor = {
    /**
     * Track attention level using face-api.js detection with all models
     * @param {Object} detection - Face detection result from face-api.js
     * @returns {Object} Attention data {level, status}
     */
    trackAttention: function(detection) {
        if (!detection) {
            return {
                level: 0,
                status: 'no_face_detected',
                timestamp: new Date().toISOString()
            };
        }

        const attentionLevel = this.calculateAttentionLevel(detection);
        const expressionData = this.analyzeExpressions(detection);

        return {
            level: attentionLevel,
            status: attentionLevel > 70 ? 'focused' : attentionLevel > 40 ? 'moderate' : 'distracted',
            faceDetected: true,
            expressions: expressionData,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Analyze facial expressions for attention insights
     * @param {Object} detection - Face detection with expressions
     * @returns {Object} Expression analysis
     */
    analyzeExpressions: function(detection) {
        if (!detection || !detection.expressions) {
            return { dominant: 'unknown', scores: {} };
        }

        const expressions = detection.expressions;
        const dominant = Object.keys(expressions).reduce((a, b) => 
            expressions[a] > expressions[b] ? a : b
        );

        return {
            dominant: dominant,
            scores: {
                neutral: Math.round(expressions.neutral * 100),
                happy: Math.round(expressions.happy * 100),
                sad: Math.round(expressions.sad * 100),
                angry: Math.round(expressions.angry * 100),
                fearful: Math.round(expressions.fearful * 100),
                disgusted: Math.round(expressions.disgusted * 100),
                surprised: Math.round(expressions.surprised * 100)
            }
        };
    },

    /**
     * Calculate attention level from face landmarks, position, and expressions
     * Robust implementation using landmark ratios for pose estimation.
     * @param {Object} detection - Face detection with all available data
     * @returns {Number} Attention level 0-100
     */
    calculateAttentionLevel: function(detection) {
        if (!detection || !detection.landmarks) {
            return 0;
        }

        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        
        // 1. Calculate Yaw (Left/Right) using Nose position relative to Eye Midpoint
        // Stable landmarks for Yaw: Nose Bridge (point 0), Nose Tip (point 3), Eyes
        const eyeMidpointX = (leftEye[0].x + rightEye[3].x) / 2;
        const noseBridgeX = nose[0].x;
        const noseTipX = nose[3].x;
        
        // Face width approximation for normalization
        const faceWidth = landmarks.getJawOutline().reduce((acc, p) => Math.max(acc, p.x), 0) - 
                         landmarks.getJawOutline().reduce((acc, p) => Math.min(acc, p.x), 1000000);
        
        // Yaw estimate based on nose tip vs bridge horizontal offset
        const yawOffset = Math.abs(noseTipX - eyeMidpointX);
        const yawThreshold = faceWidth * 0.15; // 15% of face width 
        const yawScore = Math.max(0, 100 - (yawOffset / yawThreshold * 100));

        // 2. Calculate Pitch (Up/Down) using vertical nose tip relative to eyes
        const eyeLineY = (leftEye[0].y + rightEye[3].y) / 2;
        const noseBridgeY = nose[0].y;
        const noseTipY = nose[3].y;
        
        // Pitch estimate based on eye-to-nose-tip vertical distance
        const eyeToNoseDist = noseTipY - eyeLineY;
        const faceHeight = landmarks.getJawOutline().reduce((acc, p) => Math.max(acc, p.y), 0) - eyeLineY;
        
        // Normal horizontal head has nose tip roughly at a specific fraction of face height below eyes
        const idealPitchRatio = 0.35; 
        const currentPitchRatio = eyeToNoseDist / Math.max(1, faceHeight);
        const pitchDiff = Math.abs(currentPitchRatio - idealPitchRatio);
        const pitchThreshold = 0.25; // 25% deviation allowed
        const pitchScore = Math.max(0, 100 - (pitchDiff / pitchThreshold * 100));

        // 3. Eye distance for depth and engagement
        const eyeDistance = Math.sqrt(
            Math.pow(rightEye[3].x - leftEye[0].x, 2) + 
            Math.pow(rightEye[3].y - leftEye[0].y, 2)
        );
        const normalizedEyeDistance = Math.min(100, Math.max(0, (eyeDistance - 40) / 70 * 100));
        const depthScore = normalizedEyeDistance > 30 ? 100 : 50;

        // 4. Expression analysis (FIX: removed the erroneous scaling bug)
        let expressionScore = 80; // High default for neutral learners
        if (detection.expressions) {
            const expr = detection.expressions;
            // Linear mapping: Neutral/Happy boost score, others decrease
            expressionScore = (
                (expr.neutral * 100) + 
                (expr.happy * 80) + 
                (expr.surprised * 50) + 
                (Math.max(expr.sad, expr.angry, expr.fearful, expr.disgusted) * -60)
            );
            expressionScore = Math.max(0, Math.min(100, expressionScore));
        }

        // 5. Final weighted average - favors looking straight (Yaw/Pitch)
        // Expression is weighted higher (30%) to account for focused learners who don't turn their head much
        const attentionScore = (
            yawScore * 0.30 +
            pitchScore * 0.30 +
            expressionScore * 0.30 +
            depthScore * 0.10
        );

        return Math.round(Math.max(0, Math.min(100, attentionScore)));
    },

    /**
     * Alert on detected distraction
     * @param {Number} attentionLevel - Current attention level
     * @returns {Object} Alert data if needed, null otherwise
     */
    alertDistraction: function(attentionLevel) {
        if (attentionLevel < 40) {
            return {
                severity: 'warning',
                message: 'Your attention seems low. Try to refocus on the study material.',
                timestamp: new Date().toISOString()
            };
        }

        if (attentionLevel < 20) {
            return {
                severity: 'critical',
                message: 'You appear distracted. Take a moment to refocus or take a break.',
                timestamp: new Date().toISOString()
            };
        }

        return null;
    },

    /**
     * Get session statistics including expression data
     * @param {String} sessionId
     * @returns {Object} Statistics
     */
    getSessionAttentionStats: function(sessionId) {
        const session = StudySession.getById(sessionId);
        if (!session || !session.attentionScores || session.attentionScores.length === 0) {
            return {
                avgLevel: 0,
                maxLevel: 0,
                minLevel: 0,
                count: 0,
                dominantExpressions: {}
            };
        }

        const scores = session.attentionScores;
        
        // Calculate expression frequencies if available
        const dominantExpressions = {};
        if (session.expressions && Array.isArray(session.expressions)) {
            session.expressions.forEach(expr => {
                dominantExpressions[expr] = (dominantExpressions[expr] || 0) + 1;
            });
        }
        
        return {
            avgLevel: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            maxLevel: Math.max(...scores),
            minLevel: Math.min(...scores),
            count: scores.length,
            dominantExpressions: dominantExpressions
        };
    },

    /**
     * Get overall attention trend
     * @param {Number} days - Number of days to analyze
     * @returns {Array} Array of attention trends
     */
    getAttentionTrend: function(days = 7) {
        const sessions = StudySession.getAll();
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const relevantSessions = sessions.filter(s => new Date(s.startTime) >= startDate);

        const trendData = {};
        relevantSessions.forEach(s => {
            const date = new Date(s.startTime).toDateString();
            if (!trendData[date]) {
                trendData[date] = {
                    date: date,
                    avgAttention: 0,
                    sessionCount: 0,
                    scores: []
                };
            }
            trendData[date].scores.push(...(s.attentionScores || []));
            trendData[date].sessionCount++;
        });

        // Calculate averages
        return Object.values(trendData).map(day => ({
            date: day.date,
            avgAttention: day.scores.length > 0 
                ? Math.round(day.scores.reduce((a, b) => a + b, 0) / day.scores.length)
                : 0,
            sessionCount: day.sessionCount
        }));
    }
};
