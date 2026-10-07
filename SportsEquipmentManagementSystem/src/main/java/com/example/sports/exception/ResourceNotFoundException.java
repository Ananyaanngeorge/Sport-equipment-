package com.example.sports.exception;

/**
 * Thrown when an entity (Equipment, Student, Issue) is not found in database.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
