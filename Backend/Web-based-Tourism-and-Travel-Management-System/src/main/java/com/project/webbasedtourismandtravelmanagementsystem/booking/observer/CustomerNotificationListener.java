package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer 1:
 * Notifies the customer when the booking status changes.
 */
@Component
public class CustomerNotificationListener {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;


    public CustomerNotificationListener(
            BookingRepository bookingRepository,
            NotificationService notificationService) {

        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }


    @EventListener
    public void onStatusChanged(
            BookingStatusChangedEvent event) {

        Booking booking =
                bookingRepository
                        .findById(event.bookingId())
                        .orElse(null);


        if (booking == null) {
            return;
        }


        // =====================================================
        // BOOKING REFERENCE
        // =====================================================

        String reference =
                bookingReference(
                        booking
                );


        // =====================================================
        // PACKAGE NAME
        // =====================================================

        String packageName =
                booking.getTourPackage() == null
                        ? "tour"
                        : booking
                        .getTourPackage()
                        .getName();


        // =====================================================
        // TRAVEL DATE
        // =====================================================

        String travelDate =
                booking.getTravelDate() == null
                        ? "your selected date"
                        : booking
                        .getTravelDate()
                        .toString();


        // =====================================================
        // MESSAGE BASED ON STATUS
        // =====================================================

        String[] message =
                switch (event.newStatus()) {

                    case PENDING_PAYMENT ->

                            event.oldStatus() == null

                                    ? new String[]{
                                    "Booking "
                                            + reference
                                            + " created",

                                    "Complete the payment to confirm your "
                                            + packageName
                                            + " trip."
                            }

                                    : new String[]{
                                    "Booking "
                                            + reference
                                            + " updated",

                                    "Your changes were saved. "
                                            + noteOr(
                                            event,
                                            ""
                                    )
                            };


                    case AWAITING_VERIFICATION ->

                            new String[]{
                                    "Payment received for "
                                            + reference,

                                    "We are verifying your bank transfer. "
                                            + "You will be notified once the booking is confirmed."
                            };


                    case CONFIRMED ->

                            event.oldStatus()
                                    == event.newStatus()

                                    ? new String[]{
                                    "Booking "
                                            + reference
                                            + " updated",

                                    noteOr(
                                            event,
                                            "Your booking details were updated."
                                    )
                            }

                                    : new String[]{
                                    "Booking confirmed - "
                                            + reference,

                                    "Your "
                                            + packageName
                                            + " trip starting "
                                            + travelDate
                                            + " is confirmed."
                            };


                    case COMPLETED ->

                            new String[]{
                                    "Welcome back! How was "
                                            + packageName
                                            + "?",

                                    "Share your experience by rating your tour."
                            };


                    case CANCELLED ->

                            new String[]{
                                    "Booking "
                                            + reference
                                            + " cancelled",

                                    noteOr(
                                            event,
                                            "Your booking has been cancelled."
                                    )
                            };
                };


        // =====================================================
        // SEND NOTIFICATION
        // =====================================================

        notificationService.notify(
                booking.getCustomer(),
                Notification.Type.BOOKING,
                message[0],
                message[1],
                "/customer/bookings.html"
        );
    }


    // =========================================================
    // BOOKING REFERENCE
    // =========================================================

    private String bookingReference(
            Booking booking) {

        if (booking == null
                || booking.getBookingId() == null) {

            return "BOOKING";
        }

        return "BOOK-"
                + booking.getBookingId();
    }


    // =========================================================
    // EVENT NOTE
    // =========================================================

    private static String noteOr(
            BookingStatusChangedEvent event,
            String fallback) {

        return event.note() == null
                || event.note().isBlank()

                ? fallback

                : event.note();
    }
}