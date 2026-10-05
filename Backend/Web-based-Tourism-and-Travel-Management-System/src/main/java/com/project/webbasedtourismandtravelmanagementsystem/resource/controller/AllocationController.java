package com.project.webbasedtourismandtravelmanagementsystem.resource.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.AllocationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** UC-01 Allocate Resources to Confirmed Booking. */
@RestController
@RequestMapping("/api/admin/allocations")
@PreAuthorize(Access.OPERATIONS)
public class AllocationController {

    private final AllocationService allocationService;
    private final CurrentUser currentUser;

    public AllocationController(AllocationService allocationService, CurrentUser currentUser) {
        this.allocationService = allocationService;
        this.currentUser = currentUser;
    }

    /** Confirmed upcoming bookings with what each one still needs. */
    @GetMapping
    public List<PendingAllocation> pending() {
        return allocationService.pending();
    }

    /** Booking details plus available hotels, vehicles and guides for its dates. */
    @GetMapping("/bookings/{bookingId}")
    public AllocationView view(@PathVariable Long bookingId) {
        return allocationService.view(bookingId);
    }

    @PostMapping("/bookings/{bookingId}")
    public MessageResponse allocate(@PathVariable Long bookingId, @RequestBody AllocateRequest request) {
        List<AllocationResponse> current = allocationService.allocate(bookingId, request, currentUser.details().getFullName());
        return MessageResponse.of("Resources allocated successfully", current);
    }
}
