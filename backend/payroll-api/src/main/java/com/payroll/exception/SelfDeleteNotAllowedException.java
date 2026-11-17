package com.payroll.exception;

public class SelfDeleteNotAllowedException extends RuntimeException {
    public SelfDeleteNotAllowedException(String message) {
        super(message);
    }
}
