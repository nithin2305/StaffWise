package com.staffwise.hrms.exception;

/**
 * Exception thrown when too many login attempts have been made.
 * This is part of the rate limiting security feature.
 */
public class TooManyLoginAttemptsException extends RuntimeException {
    
    private final int lockoutDurationMinutes;
    
    public TooManyLoginAttemptsException(String message, int lockoutDurationMinutes) {
        super(message);
        this.lockoutDurationMinutes = lockoutDurationMinutes;
    }
    
    public int getLockoutDurationMinutes() {
        return lockoutDurationMinutes;
    }
}
