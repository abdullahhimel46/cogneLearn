package com.cognelearn.dto.analytics;

public record RecentSessionResponse(
        String date,
        int duration,
        int avgFocus,
        boolean completed
) {
}
