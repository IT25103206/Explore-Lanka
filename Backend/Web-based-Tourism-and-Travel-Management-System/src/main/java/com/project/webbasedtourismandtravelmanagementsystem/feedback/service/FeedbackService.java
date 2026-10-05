package com.project.webbasedtourismandtravelmanagementsystem.feedback.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.model.Feedback;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Feedback Collection: post-tour ratings and reviews (PBI-08), responses by staff. */
@Service
@Transactional
public class FeedbackService {

    public record FeedbackRequest(
            @Min(value = 1, message = "Rate from 1 to 5 stars") @Max(value = 5, message = "Rate from 1 to 5 stars") int overallRating,
            @Min(value = 1, message = "Rate from 1 to 5 stars") @Max(value = 5, message = "Rate from 1 to 5 stars") Integer hotelRating,
            @Min(value = 1, message = "Rate from 1 to 5 stars") @Max(value = 5, message = "Rate from 1 to 5 stars") Integer transportRating,
            @Min(value = 1, message = "Rate from 1 to 5 stars") @Max(value = 5, message = "Rate from 1 to 5 stars") Integer guideRating,
            @NotBlank(message = "Please write a short review") @Size(min = 10, max = 2000, message = "Reviews must be 10-2000 characters") String comment,
            boolean complaint) {
    }

    public record RespondRequest(@NotBlank(message = "Write a response") @Size(max = 1000) String response) {
    }

    public record FeedbackResponse(Long id, Long bookingId, String bookingReference, Long packageId, String packageName,
                                   String customerName, int overallRating, Integer hotelRating, Integer transportRating,
                                   Integer guideRating, String comment, boolean complaint, Feedback.Status status,
                                   String response, String respondedBy, LocalDateTime respondedAt, LocalDateTime createdAt) {
        static FeedbackResponse from(Feedback f, boolean publicView) {
            String name = f.getCustomer().getFullName();
            if (publicView) {   // privacy: public reviews show first name and initial only
                String[] parts = name.split(" ");
                name = parts[0] + (parts.length > 1 ? " " + parts[parts.length - 1].charAt(0) + "." : "");
            }
            return new FeedbackResponse(f.getId(), publicView ? null : f.getBooking().getId(),
                    publicView ? null : f.getBooking().getReference(), f.getTourPackage().getId(), f.getTourPackage().getName(),
                    name, f.getOverallRating(), f.getHotelRating(), f.getTransportRating(), f.getGuideRating(), f.getComment(),
                    !publicView && f.isComplaint(), f.getStatus(), f.getResponse(), f.getRespondedBy(), f.getRespondedAt(),
                    f.getCreatedAt());
        }
    }

    private final FeedbackRepository feedbackRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public FeedbackService(FeedbackRepository feedbackRepository, BookingRepository bookingRepository,
                           NotificationService notificationService) {
        this.feedbackRepository = feedbackRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    public FeedbackResponse submit(Long bookingId, FeedbackRequest r, User customer) {
        Booking b = bookingRepository.findById(bookingId)
                .filter(x -> x.getCustomer().getId().equals(customer.getId()))
                .orElseThrow(() -> new NotFoundException("Booking", bookingId));
        if (b.getStatus() != BookingStatus.COMPLETED) {
            throw new BusinessException("You can rate a tour once it has ended");
        }
        if (feedbackRepository.existsByBookingId(bookingId)) {
            throw BusinessException.conflict("You have already reviewed this tour");
        }
        Feedback f = new Feedback();
        f.setBooking(b);
        f.setCustomer(customer);
        f.setTourPackage(b.getTourPackage());
        f.setOverallRating(r.overallRating());
        f.setHotelRating(b.getRooms() > 0 ? r.hotelRating() : null);
        f.setTransportRating(b.getPreferredVehicle() != null ? r.transportRating() : null);
        f.setGuideRating(b.isGuideRequired() ? r.guideRating() : null);
        f.setComment(r.comment().trim());
        f.setComplaint(r.complaint());
        feedbackRepository.save(f);
        if (r.complaint() || r.overallRating() <= 2) {
            notificationService.notifyRole(Role.FINANCE_COORDINATOR, Notification.Type.FEEDBACK,
                    (r.complaint() ? "Complaint" : "Low rating") + " for " + b.getReference(),
                    r.overallRating() + "/5 - " + b.getTourPackage().getName() + ": " + abbreviate(r.comment()),
                    "/admin/feedback.html");
            notificationService.notifyRole(Role.BUSINESS_MANAGER, Notification.Type.FEEDBACK,
                    (r.complaint() ? "Complaint" : "Low rating") + " for " + b.getReference(),
                    r.overallRating() + "/5 - " + b.getTourPackage().getName() + ": " + abbreviate(r.comment()),
                    "/admin/feedback.html");
        }
        return FeedbackResponse.from(f, false);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> forPackage(Long packageId) {
        return feedbackRepository.findByTourPackageIdAndStatusNotOrderByCreatedAtDesc(packageId, Feedback.Status.HIDDEN)
                .stream().map(f -> FeedbackResponse.from(f, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> mine(User customer) {
        return feedbackRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).stream()
                .map(f -> FeedbackResponse.from(f, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> all() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream().map(f -> FeedbackResponse.from(f, false)).toList();
    }

    public FeedbackResponse respond(Long id, String response, String actor) {
        Feedback f = find(id);
        f.setResponse(response.trim());
        f.setRespondedBy(actor);
        f.setRespondedAt(LocalDateTime.now());
        if (f.getStatus() != Feedback.Status.HIDDEN) {
            f.setStatus(Feedback.Status.RESPONDED);
        }
        notificationService.notify(f.getCustomer(), Notification.Type.FEEDBACK, "We replied to your review",
                "Explore Lanka responded to your review of " + f.getTourPackage().getName() + ".", "/customer/reviews.html");
        return FeedbackResponse.from(f, false);
    }

    /** Moderation: hide abusive reviews from the public page (they stay visible to staff). */
    public FeedbackResponse setHidden(Long id, boolean hidden) {
        Feedback f = find(id);
        f.setStatus(hidden ? Feedback.Status.HIDDEN : (f.getResponse() == null ? Feedback.Status.NEW : Feedback.Status.RESPONDED));
        return FeedbackResponse.from(f, false);
    }

    private Feedback find(Long id) {
        return feedbackRepository.findById(id).orElseThrow(() -> new NotFoundException("Feedback", id));
    }

    private static String abbreviate(String s) {
        return s.length() > 120 ? s.substring(0, 117) + "..." : s;
    }
}
