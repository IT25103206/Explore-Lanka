package com.project.webbasedtourismandtravelmanagementsystem.resource.controller;

import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.PartnerScheduleService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** ScheduleController from the UC-03 sequence diagram - the logistic partner portal. */
@RestController
@RequestMapping("/api/partner")
@PreAuthorize(Access.PARTNER)
public class PartnerPortalController {

    private final PartnerScheduleService scheduleService;

    public PartnerPortalController(PartnerScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/assignments")
    public List<Assignment> assignments() {
        return scheduleService.myAssignments();
    }

    // ---- hotel partners
    @GetMapping("/hotels")
    public List<HotelResponse> hotels() {
        return scheduleService.myHotels();
    }

    @GetMapping("/hotels/{id}/calendar")
    public List<CalendarDay> calendar(@PathVariable Long id,
                                      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return scheduleService.hotelCalendar(id, from, to);
    }

    @PutMapping("/hotels/{id}/availability")
    public MessageResponse updateAvailability(@PathVariable Long id, @Valid @RequestBody ScheduleUpdateRequest request) {
        return MessageResponse.of("Accommodation schedule updated successfully", scheduleService.updateHotelSchedule(id, request));
    }

    // ---- transport providers
    @GetMapping("/vehicles")
    public List<VehicleResponse> vehicles() {
        return scheduleService.myVehicles();
    }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse addVehicle(@Valid @RequestBody VehicleRequest request) {
        return scheduleService.saveMyVehicle(null, request);
    }

    @PutMapping("/vehicles/{id}")
    public VehicleResponse updateVehicle(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return scheduleService.saveMyVehicle(id, request);
    }

    // ---- tour guides
    @GetMapping("/guide")
    public GuideResponse guideProfile() {
        return scheduleService.myGuideProfile();
    }

    @PostMapping("/bookings/{bookingId}/waypoints")
    public MessageResponse addWaypoint(@PathVariable Long bookingId, @Valid @RequestBody WaypointRequest request) {
        scheduleService.addWaypoint(bookingId, request);
        return MessageResponse.of("Waypoint added to the route plan");
    }

    // ---- unavailable days (vehicles and guides)
    @GetMapping("/{type}/{id}/blocked-dates")
    public List<BlockedDateResponse> blockedDates(@PathVariable ResourceType type, @PathVariable Long id) {
        return scheduleService.blockedDates(type, id);
    }

    @PostMapping("/{type}/{id}/blocked-dates")
    public List<BlockedDateResponse> block(@PathVariable ResourceType type, @PathVariable Long id,
                                           @Valid @RequestBody BlockDatesRequest request) {
        return scheduleService.block(type, id, request);
    }

    @DeleteMapping("/{type}/{id}/blocked-dates/{blockedId}")
    public MessageResponse unblock(@PathVariable ResourceType type, @PathVariable Long id, @PathVariable Long blockedId) {
        scheduleService.unblock(type, id, blockedId);
        return MessageResponse.of("Day made available again");
    }
}
