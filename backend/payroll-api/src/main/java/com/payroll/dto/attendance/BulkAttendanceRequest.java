package com.payroll.dto.attendance;

import com.payroll.enums.AttendanceStatus;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class BulkAttendanceRequest {
    private List<Long> employeeIds;
    private LocalDate attendanceDate;
    private AttendanceStatus status;
    private String remarks;
}
