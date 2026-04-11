package com.cognelearn.web;

import java.time.Instant;

public record ApiError(
        String message,
        Instant timestamp
) {
}
