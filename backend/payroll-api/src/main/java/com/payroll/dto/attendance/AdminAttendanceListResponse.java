package com.payroll.dto.attendance;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAttendanceListResponse {
    private Long employeeId;
    private String name;
    private String role; // Maps to WorkMode (WFH, OFFICE, ON_SITE)
    private String status; // PRESENT, ABSENT
    private String remarks;
}
