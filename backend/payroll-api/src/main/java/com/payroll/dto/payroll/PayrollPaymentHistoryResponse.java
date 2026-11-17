package com.payroll.dto.payroll;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PayrollPaymentHistoryResponse {
    private Long paymentId;
    private BigDecimal amount;
    private LocalDateTime paidAt;
    private String paidBy;
    private int payrollMonth;
    private int payrollYear;
}
