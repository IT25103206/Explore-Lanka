package com.project.webbasedtourismandtravelmanagementsystem.booking.observer;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Observer 2: keeps the operations and finance teams informed. */
@Component
public class OperationsNotificationListener {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public OperationsNotificationListener(BookingRepository bookingRepository, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    @EventListener
    public void onStatusChanged(BookingStatusChangedEvent event) {
        if (event.oldStatus() == event.newStatus()) {
            return;
        }
        Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
        if (b == null) {
            return;
        }
        String summary = b.getReference() + " - " + b.getTourPackage().getName() + ", " + b.travellerCount()
                + " traveller(s), " + b.getStartDate() + " to " + b.getEndDate();
        if (event.newStatus() == BookingStatus.CONFIRMED) {
            notificationService.notifyRole(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.BOOKING,
                    "New confirmed booking", summary, "/admin/allocations.html?booking=" + b.getId());
        } else if (event.newStatus() == BookingStatus.AWAITING_VERIFICATION) {
            notificationService.notifyRole(Role.FINANCE_COORDINATOR, Notification.Type.PAYMENT,
                    "Bank transfer to verify", summary + ". Amount LKR " + b.getTotalAmount().toPlainString(),
                    "/admin/payments.html");
        } else if (event.newStatus() == BookingStatus.CANCELLED) {
            notificationService.notifyRole(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.BOOKING,
                    "Booking cancelled", summary + (event.note() == null ? "" : ". " + event.note()) + " Its resources have been released.", "/admin/allocations.html");
            if (event.oldStatus() == BookingStatus.CONFIRMED) {
                notificationService.notifyRole(Role.FINANCE_COORDINATOR, Notification.Type.PAYMENT,
                        "Refund request for " + b.getReference(), "A paid booking was cancelled. Please review the refund.",
                        "/admin/payments.html");
            }
        }
    }
}
