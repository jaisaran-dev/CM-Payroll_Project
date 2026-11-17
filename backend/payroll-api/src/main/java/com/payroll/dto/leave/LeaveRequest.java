package com.payroll.dto.leave;

import com.payroll.enums.LeaveSession;
import com.payroll.enums.LeaveType;
import lombok.Data;
import java.time.LocalDate;

@Data
public class LeaveRequest {
    // employeeId is kept for Admin usage, but Employee APIs will ignore this and use the JWT token
    private Long employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String subject;
    private String reason;
    private LeaveType leaveType;
    private LeaveSession session; // Nullable if Full Day
}
