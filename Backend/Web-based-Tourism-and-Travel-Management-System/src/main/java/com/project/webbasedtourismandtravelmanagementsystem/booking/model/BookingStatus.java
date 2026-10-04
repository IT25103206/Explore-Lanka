package com.project.webbasedtourismandtravelmanagementsystem.booking.model;

/**
 * PENDING_PAYMENT -> (card / eZ Cash)      -> CONFIRMED -> COMPLETED
 * PENDING_PAYMENT -> (bank transfer)       -> AWAITING_VERIFICATION -> CONFIRMED
 * any active state                         -> CANCELLED
 */
public enum BookingStatus {
    PENDING_PAYMENT, AWAITING_VERIFICATION, CONFIRMED, COMPLETED, CANCELLED;

    public boolean isActive() {
        return this == PENDING_PAYMENT || this == AWAITING_VERIFICATION || this == CONFIRMED;
    }
}
