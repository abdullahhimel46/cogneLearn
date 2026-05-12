package com.abd.cognelearn.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsDTO {
    private long totalUsers;
    private long activeSessions;
    private long totalPlaylists;
    private String systemStatus;
}
