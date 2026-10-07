package com.example.sports.exception;

/**
 * Thrown when business rules fail (e.g. insufficient quantity, duplicate email, active issue blocking deletion).
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
