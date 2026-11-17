package com.payroll.dto.employee;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class EmployeeResponse {
    private Long id;
    private String name;
    private String workMode;
    private String salaryType;
    private BigDecimal salaryAmount;

    private String email;
    private String systemRole;
    private Boolean isActive;
}
