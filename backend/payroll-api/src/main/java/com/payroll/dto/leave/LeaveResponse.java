package com.payroll.dto.leave;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LeaveResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String subject;
    private String reason;
    private String leaveType;
    private String session;
    private String status;
    private String managerRemark;
    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;
}
