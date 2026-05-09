package com.cognelearn.dto.session;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * AttentionScoreRequest — a single attention score reading sent from the browser.
 *
 * <p>The browser's face-api.js attention tracker calls this endpoint approximately
 * every 1.5 seconds during an active study session.
 *
 * <p>Maps to the JavaScript {@code StudySession.addAttentionScore(sessionId, score)} call
 * in {@code StudySession.js}, and the score is calculated by
 * {@code AttentionMonitor.calculateAttentionLevel(detection)} in {@code AttentionMonitor.js}.
 *
 * <p>Example JSON body from browser:
 * <pre>
 * { "score": 78 }
 * </pre>
 *
 * @param score the attention level between 0 (completely distracted) and 100 (fully focused)
 */
public record AttentionScoreRequest(

        /**
         * The attention score, validated to be between 0 and 100 inclusive.
         *
         * <p>Score ranges (from JS {@code AttentionMonitor.trackAttention()}):
         * <ul>
         *   <li>70–100: "focused"</li>
         *   <li>40–69: "moderate"</li>
         *   <li>0–39: "distracted"</li>
         * </ul>
         */
        @NotNull(message = "Score is required")
        @Min(value = 0, message = "Score cannot be less than 0")
        @Max(value = 100, message = "Score cannot be more than 100")
        Integer score
) {
}
