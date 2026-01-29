package com.staffwise.hrms.exception;

public class InvalidPayrollStateException extends RuntimeException {
    public InvalidPayrollStateException(String message) {
        super(message);
    }
}
