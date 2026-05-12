package com.abd.cognelearn.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MilestoneDTO {
    private String userName;
    private String description;
    private String time;
}
