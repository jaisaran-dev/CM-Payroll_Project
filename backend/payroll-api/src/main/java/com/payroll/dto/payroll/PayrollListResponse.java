package com.payroll.dto.payroll;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class PayrollListResponse {
    private Long employeeId;
    private String employeeName;
    private String email;
    private String paymentType;
    private LocalDate paidOn;
    private int totalDays;
    private BigDecimal baseSalary;
    private BigDecimal payableAmount;
    private BigDecimal paidAmount;
    private BigDecimal balance;
    private String status;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String breakdown;
}
