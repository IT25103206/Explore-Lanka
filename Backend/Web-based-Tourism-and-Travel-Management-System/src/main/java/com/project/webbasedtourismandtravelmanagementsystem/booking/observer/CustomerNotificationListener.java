package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Observer 1: tells the tourist what happened to their booking. */
@Component
public class CustomerNotificationListener {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public CustomerNotificationListener(BookingRepository bookingRepository, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    @EventListener
    public void onStatusChanged(BookingStatusChangedEvent event) {
        Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
        if (b == null) {
            return;
        }
        String ref = b.getReference();
        String pkg = b.getTourPackage().getName();
        String[] msg = switch (event.newStatus()) {
            case PENDING_PAYMENT -> event.oldStatus() == null
                    ? new String[]{"Booking " + ref + " created", "Complete the payment to confirm your " + pkg + " trip."}
                    : new String[]{"Booking " + ref + " updated", "Your changes were saved. " + noteOr(event, "")};
            case AWAITING_VERIFICATION -> new String[]{"Payment received for " + ref,
                    "We are verifying your bank transfer. You will be notified once the booking is confirmed."};
            case CONFIRMED -> event.oldStatus() == event.newStatus()
                    ? new String[]{"Booking " + ref + " updated", noteOr(event, "Your traveller details were updated.")}
                    : new String[]{"Booking confirmed - " + ref, "Your " + pkg + " trip starting " + b.getStartDate()
                    + " is confirmed. Your itinerary and invoice are ready."};
            case COMPLETED -> new String[]{"Welcome back! How was " + pkg + "?",
                    "Share your experience by rating your tour - it helps our partners improve."};
            case CANCELLED -> new String[]{"Booking " + ref + " cancelled", noteOr(event, "Your booking has been cancelled.")};
        };
        notificationService.notify(b.getCustomer(), Notification.Type.BOOKING, msg[0], msg[1], "/customer/bookings.html");
    }

    private static String noteOr(BookingStatusChangedEvent e, String fallback) {
        return e.note() == null || e.note().isBlank() ? fallback : e.note();
    }
}
