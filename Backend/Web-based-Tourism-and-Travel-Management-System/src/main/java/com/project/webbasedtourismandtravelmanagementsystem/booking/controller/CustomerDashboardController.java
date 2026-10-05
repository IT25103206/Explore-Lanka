package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.BookingResponse;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
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

/** Customer dashboard summary (overview & quick access). */
@RestController
@PreAuthorize(Access.CUSTOMER)
public class CustomerDashboardController {

    public record CustomerDashboard(long totalBookings, long upcomingTrips, long wishlistItems, long reviews,
                                    long unreadNotifications, List<BookingResponse> upcoming, List<BookingResponse> actionNeeded) {
    }

    private final BookingService bookingService;
    private final WishlistRepository wishlistRepository;
    private final FeedbackRepository feedbackRepository;
    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    public CustomerDashboardController(BookingService bookingService, WishlistRepository wishlistRepository,
                                       FeedbackRepository feedbackRepository, NotificationService notificationService,
                                       CurrentUser currentUser) {
        this.bookingService = bookingService;
        this.wishlistRepository = wishlistRepository;
        this.feedbackRepository = feedbackRepository;
        this.notificationService = notificationService;
        this.currentUser = currentUser;
    }

    @GetMapping("/api/customer/dashboard")
    public CustomerDashboard dashboard() {
        Long me = currentUser.id();
        List<BookingResponse> all = bookingService.myBookings(currentUser.entity());
        LocalDate today = LocalDate.now();
        List<BookingResponse> upcoming = all.stream()
                .filter(b -> b.status() == BookingStatus.CONFIRMED && !b.endDate().isBefore(today))
                .sorted(Comparator.comparing(BookingResponse::startDate))
                .toList();
        List<BookingResponse> action = all.stream()
                .filter(b -> b.canPay() || b.canReview())
                .toList();
        return new CustomerDashboard(all.size(), upcoming.size(), wishlistRepository.countByCustomerId(me),
                feedbackRepository.findByCustomerIdOrderByCreatedAtDesc(me).size(), notificationService.unreadCount(me),
                upcoming.stream().limit(3).toList(), action);
    }
}
