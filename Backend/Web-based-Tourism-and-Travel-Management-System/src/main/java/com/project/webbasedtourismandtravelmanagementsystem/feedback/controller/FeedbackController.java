package com.project.webbasedtourismandtravelmanagementsystem.feedback.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.service.FeedbackService;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.service.FeedbackService.FeedbackRequest;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.service.FeedbackService.FeedbackResponse;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.service.FeedbackService.RespondRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final CurrentUser currentUser;

    public FeedbackController(FeedbackService feedbackService, CurrentUser currentUser) {
        this.feedbackService = feedbackService;
        this.currentUser = currentUser;
    }

    @GetMapping("/api/public/packages/{packageId}/reviews")
    public List<FeedbackResponse> reviews(@PathVariable Long packageId) {
        return feedbackService.forPackage(packageId);
    }

    @PostMapping("/api/customer/bookings/{bookingId}/feedback")
    @PreAuthorize(Access.CUSTOMER)
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackResponse submit(@PathVariable Long bookingId, @Valid @RequestBody FeedbackRequest request) {
        return feedbackService.submit(bookingId, request, currentUser.entity());
    }

    @GetMapping("/api/customer/feedback")
    @PreAuthorize(Access.CUSTOMER)
    public List<FeedbackResponse> mine() {
        return feedbackService.mine(currentUser.entity());
    }

    @GetMapping("/api/admin/feedback")
    @PreAuthorize(Access.FEEDBACK)
    public List<FeedbackResponse> all() {
        return feedbackService.all();
    }

    @PostMapping("/api/admin/feedback/{id}/respond")
    @PreAuthorize(Access.FEEDBACK)
    public FeedbackResponse respond(@PathVariable Long id, @Valid @RequestBody RespondRequest request) {
        return feedbackService.respond(id, request.response(), currentUser.details().getFullName());
    }

    @PostMapping("/api/admin/feedback/{id}/visibility")
    @PreAuthorize(Access.FEEDBACK)
    public FeedbackResponse visibility(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return feedbackService.setHidden(id, Boolean.TRUE.equals(body.get("hidden")));
    }
}
