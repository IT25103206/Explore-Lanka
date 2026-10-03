package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.wishlist.WishlistRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Customer dashboard summary.
 */
@RestController
@PreAuthorize(Access.CUSTOMER)
public class CustomerDashboardController {

    // =========================================================
    // DASHBOARD BOOKING DTO
    // =========================================================

    public record DashboardBooking(
            Long id,
            String reference,
            String packageName,
            LocalDate travelDate,
            int travellers,
            String status,
            Double totalAmount,
            boolean canPay,
            boolean canReview
    ) {
    }


    // =========================================================
    // DASHBOARD RESPONSE
    // =========================================================

    public record CustomerDashboard(
            long totalBookings,
            long upcomingTrips,
            long wishlistItems,
            long reviews,
            long unreadNotifications,
            List<DashboardBooking> upcoming,
            List<DashboardBooking> actionNeeded
    ) {
    }


    // =========================================================
    // DEPENDENCIES
    // =========================================================

    private final BookingService bookingService;
    private final WishlistRepository wishlistRepository;
    private final FeedbackRepository feedbackRepository;
    private final NotificationService notificationService;
    private final CurrentUser currentUser;


    public CustomerDashboardController(
            BookingService bookingService,
            WishlistRepository wishlistRepository,
            FeedbackRepository feedbackRepository,
            NotificationService notificationService,
            CurrentUser currentUser) {

        this.bookingService = bookingService;
        this.wishlistRepository = wishlistRepository;
        this.feedbackRepository = feedbackRepository;
        this.notificationService = notificationService;
        this.currentUser = currentUser;
    }


    // =========================================================
    // DASHBOARD
    // =========================================================

    @GetMapping("/api/customer/dashboard")
    public CustomerDashboard dashboard() {

        Long customerId =
                currentUser.id();

        List<Booking> bookings =
                bookingService
                        .getBookingsByCustomer(
                                customerId
                        );


        LocalDate today =
                LocalDate.now();


        // -----------------------------------------------------
        // Upcoming trips
        // -----------------------------------------------------

        List<DashboardBooking> upcoming =
                bookings.stream()

                        .filter(this::isConfirmed)

                        .filter(booking ->
                                booking.getTravelDate() != null
                                        && !booking
                                        .getTravelDate()
                                        .isBefore(today)
                        )

                        .sorted(
                                Comparator.comparing(
                                        Booking::getTravelDate
                                )
                        )

                        .map(
                                this::toDashboardBooking
                        )

                        .toList();


        // -----------------------------------------------------
        // Bookings needing customer action
        // -----------------------------------------------------

        List<DashboardBooking> actionNeeded =
                bookings.stream()

                        .filter(booking ->
                                canPay(booking)
                                        || canReview(booking)
                        )

                        .map(
                                this::toDashboardBooking
                        )

                        .toList();


        // -----------------------------------------------------
        // Review count
        // -----------------------------------------------------

        long reviews =
                feedbackRepository
                        .findByCustomer_UserIdOrderByFeedbackIdDesc(
                                customerId
                        )
                        .size();


        // -----------------------------------------------------
        // Response
        // -----------------------------------------------------

        return new CustomerDashboard(

                bookings.size(),

                upcoming.size(),

                wishlistRepository
                        .countByCustomerId(
                                customerId
                        ),

                reviews,

                notificationService
                        .unreadCount(
                                customerId
                        ),

                upcoming
                        .stream()
                        .limit(3)
                        .toList(),

                actionNeeded
        );
    }


    // =========================================================
    // MAP BOOKING
    // =========================================================

    private DashboardBooking toDashboardBooking(
            Booking booking) {

        return new DashboardBooking(

                booking.getBookingId(),

                bookingReference(
                        booking
                ),

                booking.getTourPackage() == null
                        ? "Tour"
                        : booking
                        .getTourPackage()
                        .getName(),

                booking.getTravelDate(),

                booking.getNumberOfPeople() == null
                        ? 0
                        : booking.getNumberOfPeople(),

                booking.getStatus(),

                booking.getTotalAmount(),

                canPay(
                        booking
                ),

                canReview(
                        booking
                )
        );
    }


    // =========================================================
    // CONFIRMED CHECK
    // =========================================================

    private boolean isConfirmed(
            Booking booking) {

        return booking != null
                && booking.getStatus() != null
                && booking
                .getStatus()
                .trim()
                .equalsIgnoreCase(
                        "CONFIRMED"
                );
    }


    // =========================================================
    // CAN PAY
    // =========================================================

    private boolean canPay(
            Booking booking) {

        if (booking == null
                || booking.getStatus() == null) {

            return false;
        }

        String status =
                booking
                        .getStatus()
                        .trim()
                        .toUpperCase();

        return status.equals("PENDING")
                || status.equals("PENDING_PAYMENT");
    }


    // =========================================================
    // CAN REVIEW
    // =========================================================

    private boolean canReview(
            Booking booking) {

        if (booking == null
                || booking.getStatus() == null) {

            return false;
        }

        return booking
                .getStatus()
                .trim()
                .equalsIgnoreCase(
                        "COMPLETED"
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