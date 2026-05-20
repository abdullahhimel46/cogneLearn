package com.abd.cognelearn.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record SendCustomEmailRequest(
        @NotNull UUID userId,
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 4000) String message
) {
}
