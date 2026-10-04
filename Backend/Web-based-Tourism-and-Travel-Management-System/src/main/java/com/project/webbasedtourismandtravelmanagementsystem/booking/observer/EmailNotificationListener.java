package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer 3: simulated e-mail confirmation. A real deployment would plug in an SMTP sender
 * here; for the academic version the e-mail is written to the application log.
 */
@Component
public class EmailNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationListener.class);

    private final BookingRepository bookingRepository;

    public EmailNotificationListener(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @EventListener
    public void onStatusChanged(BookingStatusChangedEvent event) {
        Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
        if (b == null || event.oldStatus() == event.newStatus()) {
            return;
        }
        log.info("[SIMULATED E-MAIL] to={} subject=\"Explore Lanka booking {} is now {}\" package=\"{}\" total=LKR {}",
                b.getCustomer().getEmail(), b.getReference(), event.newStatus(), b.getTourPackage().getName(),
                b.getTotalAmount().toPlainString());
    }
}
