package com.project.webbasedtourismandtravelmanagementsystem.Common;

/** Simple confirmation message returned by action endpoints. */
public record MessageResponse(String message, Object data) {

    public static MessageResponse of(String message) {
        return new MessageResponse(message, null);
    }

    public static MessageResponse of(String message, Object data) {
        return new MessageResponse(message, data);
    }
}
