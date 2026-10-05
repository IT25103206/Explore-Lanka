package com.project.webbasedtourismandtravelmanagementsystem.Common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.List;

/**
 * A rule of the business was broken (e.g. double booking, invalid discount, scheduling clash).
 * {@code details} carries extra lines for the UI, such as the conflicting booking references.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final List<String> details;

    public BusinessException(String message) {
        this(HttpStatus.BAD_REQUEST, message, List.of());
    }

    public BusinessException(HttpStatus status, String message) {
        this(status, message, List.of());
    }

    public BusinessException(HttpStatus status, String message, List<String> details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public static BusinessException conflict(String message, List<String> details) {
        return new BusinessException(HttpStatus.CONFLICT, message, details);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(HttpStatus.CONFLICT, message, List.of());
    }
}
