package com.project.webbasedtourismandtravelmanagementsystem.common.exception;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String what, Object id) {
        super(what + " " + id + " was not found");
    }

    public NotFoundException(String message) {
        super(message);
    }
}
