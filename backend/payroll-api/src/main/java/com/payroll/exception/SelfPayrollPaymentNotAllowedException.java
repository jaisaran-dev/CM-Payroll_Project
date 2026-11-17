package com.payroll.exception;

public class SelfPayrollPaymentNotAllowedException extends RuntimeException {
    public SelfPayrollPaymentNotAllowedException(String message) {
        super(message);
    }
}
