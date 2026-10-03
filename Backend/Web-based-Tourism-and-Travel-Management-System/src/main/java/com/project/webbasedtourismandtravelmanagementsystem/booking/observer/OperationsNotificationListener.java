package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer 2:
 * Keeps the operations and finance teams informed.
 */
@Component
public class OperationsNotificationListener {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;


    public OperationsNotificationListener(
            BookingRepository bookingRepository,
            NotificationService notificationService) {

        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }


    @EventListener
    public void onStatusChanged(
            BookingStatusChangedEvent event) {

        if (event == null) {
            return;
        }

        if (event.oldStatus() == event.newStatus()) {
            return;
        }

        Booking booking =
                bookingRepository
                        .findById(event.bookingId())
                        .orElse(null);

        if (booking == null) {
            return;
        }


        // =====================================================
        // CURRENT BOOKING MODEL VALUES
        // =====================================================

        String reference =
                bookingReference(booking);

        String packageName =
                booking.getTourPackage() == null
                        ? "Tour Package"
                        : booking.getTourPackage().getName();

        int travellers =
                booking.getNumberOfPeople() == null
                        ? 0
                        : booking.getNumberOfPeople();

        String travelDate =
                booking.getTravelDate() == null
                        ? "date not selected"
                        : booking.getTravelDate().toString();


        String summary =
                reference
                        + " - "
                        + packageName
                        + ", "
                        + travellers
                        + " traveller(s), travel date "
                        + travelDate;


        // =====================================================
        // CONFIRMED
        // =====================================================

        if (event.newStatus()
                == BookingStatus.CONFIRMED) {

            notificationService.notifyRole(
                    Role.LOGISTIC_SUPPLIER_MANAGER,

                    Notification.Type.BOOKING,

                    "New confirmed booking",

                    summary,

                    "/admin/allocations.html?booking="
                            + booking.getBookingId()
            );
        }


        // =====================================================
        // AWAITING BANK VERIFICATION
        // =====================================================

        else if (event.newStatus()
                == BookingStatus.AWAITING_VERIFICATION) {

            double total =
                    booking.getTotalAmount() == null
                            ? 0.0
                            : booking.getTotalAmount();

            String amount =
                    String.format(
                            "%.2f",
                            total
                    );

            notificationService.notifyRole(
                    Role.FINANCE_COORDINATOR,

                    Notification.Type.PAYMENT,

                    "Bank transfer to verify",

                    summary
                            + ". Amount LKR "
                            + amount,

                    "/admin/payments.html"
            );
        }


        // =====================================================
        // CANCELLED
        // =====================================================

        else if (event.newStatus()
                == BookingStatus.CANCELLED) {

            String note =
                    event.note() == null
                            || event.note().isBlank()
                            ? ""
                            : ". " + event.note();

            notificationService.notifyRole(
                    Role.LOGISTIC_SUPPLIER_MANAGER,

                    Notification.Type.BOOKING,

                    "Booking cancelled",

                    summary
                            + note
                            + ". Its resources have been released.",

                    "/admin/allocations.html"
            );


            // Paid/confirmed booking cancelled -> refund review
            if (event.oldStatus()
                    == BookingStatus.CONFIRMED) {

                notificationService.notifyRole(
                        Role.FINANCE_COORDINATOR,

                        Notification.Type.PAYMENT,

                        "Refund request for "
                                + reference,

                        "A paid booking was cancelled. "
                                + "Please review the refund.",

                        "/admin/payments.html"
                );
            }
        }
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
}