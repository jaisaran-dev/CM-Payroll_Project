package com.payroll.dto.attendance;

import com.payroll.enums.AttendanceStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AdminAttendanceRequest {
    private Long employeeId;
    private LocalDate attendanceDate;
    private AttendanceStatus status;
    private String remarks;
}
