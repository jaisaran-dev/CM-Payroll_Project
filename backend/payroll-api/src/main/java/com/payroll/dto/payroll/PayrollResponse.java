package com.payroll.dto.payroll;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PayrollResponse {
    private Long employeeId;
    private String employeeName;
    private String salaryType;
    private BigDecimal baseSalary;
    private int presentDays;
    private BigDecimal calculatedPay;
    private String breakdown;
}
