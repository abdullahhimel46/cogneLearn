package com.cognelearn.dto.session;

import jakarta.validation.constraints.NotNull;

public record SessionCompleteRequest(
        @NotNull Integer completedDuration
) {
}
