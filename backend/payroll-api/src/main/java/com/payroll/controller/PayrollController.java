package com.payroll.controller;

import com.payroll.dto.common.ApiResponse;
import com.payroll.dto.payroll.PayrollListResponse;
import com.payroll.dto.payroll.PayrollPaymentHistoryResponse;
import com.payroll.dto.payroll.PayrollPaymentRequest;
import com.payroll.dto.payroll.PayrollResponse;
import com.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {
    private final PayrollService payrollService;

    @GetMapping("/employee/{id}")
    public ResponseEntity<PayrollResponse> getPayroll(
            @PathVariable Long id,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(payrollService.calculate(id, month, year));
    }

    @GetMapping("/admin/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollListResponse>>> getCurrentPayrollList() {
        List<PayrollListResponse> data = payrollService.getCurrentPayrollList(LocalDate.now());
        return ResponseEntity.ok(ApiResponse.<List<PayrollListResponse>>builder()
                .success(true)
                .message("Current month payroll list fetched successfully")
                .data(data)
                .build());
    }

    @PostMapping("/admin/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PayrollListResponse>> recordPayment(
            @Valid @RequestBody PayrollPaymentRequest request,
            Authentication authentication) {
        PayrollListResponse data = payrollService.recordCurrentPayrollPayment(
                request, LocalDateTime.now(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.<PayrollListResponse>builder()
                .success(true)
                .message("Payment submitted successfully")
                .data(data)
                .build());
    }

    @GetMapping("/admin/{employeeId}/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollPaymentHistoryResponse>>> getPaymentHistory(
            @PathVariable Long employeeId) {
        List<PayrollPaymentHistoryResponse> data = payrollService.getPaymentHistory(employeeId);
        return ResponseEntity.ok(ApiResponse.<List<PayrollPaymentHistoryResponse>>builder()
                .success(true)
                .message("Payroll payment history fetched successfully")
                .data(data)
                .build());
    }
}
