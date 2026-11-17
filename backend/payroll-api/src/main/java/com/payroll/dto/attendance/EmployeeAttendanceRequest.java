package com.payroll.dto.attendance;

import com.payroll.enums.AttendanceStatus;
import lombok.Data;

@Data
public class EmployeeAttendanceRequest {
    private AttendanceStatus status;
    private String remarks;
}
