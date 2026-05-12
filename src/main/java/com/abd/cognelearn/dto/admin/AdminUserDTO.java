package com.abd.cognelearn.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserDTO {
    private UUID id;
    private String name;
    private String email;
    private Instant joined;
    private boolean active;
}
