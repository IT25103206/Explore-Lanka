package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;

/**
 * OBSERVER PATTERN - the "subject" message.
 * BookingService publishes this whenever a booking changes state; it does not know who listens.
 * Listeners (customer notification, operations notification, e-mail) react independently, so
 * new reactions (e.g. SMS) can be added without changing the booking code.
 *
 * @param oldStatus null when the booking was just created
 */
public record BookingStatusChangedEvent(Long bookingId, BookingStatus oldStatus, BookingStatus newStatus, String note) {
}
