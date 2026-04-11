package com.cognelearn.dto.session;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AttentionScoreRequest(
        @Min(0) @Max(100) int score
) {
}
