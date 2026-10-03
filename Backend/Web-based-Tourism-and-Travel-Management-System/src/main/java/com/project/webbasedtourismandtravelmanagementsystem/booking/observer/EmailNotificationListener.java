package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer 3:
 * Simulated e-mail confirmation.
 *
 * A real deployment can later replace this with an SMTP sender.
 */
@Component
public class EmailNotificationListener {

    private static final Logger log =
            LoggerFactory.getLogger(
                    EmailNotificationListener.class
            );

    private final BookingRepository bookingRepository;


    public EmailNotificationListener(
            BookingRepository bookingRepository) {

        this.bookingRepository =
                bookingRepository;
    }


    @EventListener
    public void onStatusChanged(
            BookingStatusChangedEvent event) {

        Booking booking =
                bookingRepository
                        .findById(
                                event.bookingId()
                        )
                        .orElse(null);


        if (booking == null) {
            return;
        }


        if (event.oldStatus()
                == event.newStatus()) {

            return;
        }


        // -----------------------------------------------------
        // Booking reference
        // Current Booking has no getReference()
        // -----------------------------------------------------

        String reference =
                bookingReference(
                        booking
                );


        // -----------------------------------------------------
        // Customer email
        // -----------------------------------------------------

        String email =
                booking.getCustomer() == null
                        ? "unknown"
                        : booking
                        .getCustomer()
                        .getEmail();


        // -----------------------------------------------------
        // Package name
        // -----------------------------------------------------

        String packageName =
                booking.getTourPackage() == null
                        ? "Tour"
                        : booking
                        .getTourPackage()
                        .getName();


        // -----------------------------------------------------
        // Total amount
        // getTotalAmount() is Double, not BigDecimal
        // -----------------------------------------------------

        String totalAmount =
                booking.getTotalAmount() == null
                        ? "0.00"
                        : String.format(
                        "%.2f",
                        booking.getTotalAmount()
                );


        log.info(
                "[SIMULATED E-MAIL] "
                        + "to={} "
                        + "subject=\"Explore Lanka booking {} is now {}\" "
                        + "package=\"{}\" "
                        + "total=LKR {}",

                email,
                reference,
                event.newStatus(),
                packageName,
                totalAmount
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
}