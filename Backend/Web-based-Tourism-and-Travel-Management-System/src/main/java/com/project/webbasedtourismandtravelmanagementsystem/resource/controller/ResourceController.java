package com.project.webbasedtourismandtravelmanagementsystem.resource.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Hotels and vehicles (Logistic Supplier Management) and tour guides (Business Manager). */
@RestController
@RequestMapping("/api/admin/resources")
@PreAuthorize(Access.OPERATIONS)
public class ResourceController {

    private final ResourceService resourceService;
    private final CurrentUser currentUser;

    public ResourceController(ResourceService resourceService, CurrentUser currentUser) {
        this.resourceService = resourceService;
        this.currentUser = currentUser;
    }

    // ---- hotels
    @GetMapping("/hotels")
    @PreAuthorize(Access.OPERATIONS + " or " + Access.PARTNERS)   // read-only for the Business Manager (linking service rates)
    public List<HotelResponse> hotels() {
        return resourceService.hotels();
    }

    @PostMapping("/hotels")
    @ResponseStatus(HttpStatus.CREATED)
    public HotelResponse createHotel(@Valid @RequestBody HotelRequest request) {
        return resourceService.saveHotel(null, request);
    }

    @PutMapping("/hotels/{id}")
    public HotelResponse updateHotel(@PathVariable Long id, @Valid @RequestBody HotelRequest request) {
        return resourceService.saveHotel(id, request);
    }

    @DeleteMapping("/hotels/{id}")
    public MessageResponse deleteHotel(@PathVariable Long id) {
        resourceService.deleteHotel(id);
        return MessageResponse.of("Hotel removed");
    }

    @GetMapping("/hotels/{id}/calendar")
    public List<CalendarDay> hotelCalendar(@PathVariable Long id,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return resourceService.hotelCalendar(id, from, to);
    }

    // ---- vehicles
    @GetMapping("/vehicles")
    @PreAuthorize(Access.OPERATIONS + " or " + Access.PARTNERS)   // read-only for the Business Manager (linking service rates)
    public List<VehicleResponse> vehicles() {
        return resourceService.vehicles();
    }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse createVehicle(@Valid @RequestBody VehicleRequest request) {
        return resourceService.saveVehicle(null, request);
    }

    @PutMapping("/vehicles/{id}")
    public VehicleResponse updateVehicle(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return resourceService.saveVehicle(id, request);
    }

    @DeleteMapping("/vehicles/{id}")
    public MessageResponse deleteVehicle(@PathVariable Long id) {
        resourceService.deleteVehicle(id);
        return MessageResponse.of("Vehicle removed");
    }

    // ---- guides
    @GetMapping("/guides")
    @PreAuthorize(Access.GUIDES)
    public List<GuideResponse> guides() {
        return resourceService.guides();
    }

    @PostMapping("/guides")
    @PreAuthorize(Access.GUIDES)
    @ResponseStatus(HttpStatus.CREATED)
    public GuideResponse createGuide(@Valid @RequestBody GuideRequest request) {
        return resourceService.saveGuide(null, request, currentUser.role() == Role.SYSTEM_ADMIN);
    }

    @PutMapping("/guides/{id}")
    @PreAuthorize(Access.GUIDES)
    public GuideResponse updateGuide(@PathVariable Long id, @Valid @RequestBody GuideRequest request) {
        return resourceService.saveGuide(id, request, currentUser.role() == Role.SYSTEM_ADMIN);
    }

    @DeleteMapping("/guides/{id}")
    @PreAuthorize(Access.GUIDES)
    public MessageResponse deleteGuide(@PathVariable Long id) {
        resourceService.deleteGuide(id);
        return MessageResponse.of("Guide removed");
    }

    // ---- unavailable days for vehicles and guides
    @GetMapping("/{type}/{id}/blocked-dates")
    @PreAuthorize(Access.BLOCKED_DATES)
    public List<BlockedDateResponse> blockedDates(@PathVariable ResourceType type, @PathVariable Long id) {
        return resourceService.blockedDates(type, id);
    }

    @PostMapping("/{type}/{id}/blocked-dates")
    @PreAuthorize(Access.BLOCKED_DATES)
    public List<BlockedDateResponse> block(@PathVariable ResourceType type, @PathVariable Long id,
                                           @Valid @RequestBody BlockDatesRequest request) {
        return resourceService.block(type, id, request);
    }

    @DeleteMapping("/{type}/{id}/blocked-dates/{blockedId}")
    @PreAuthorize(Access.BLOCKED_DATES)
    public MessageResponse unblock(@PathVariable ResourceType type, @PathVariable Long id, @PathVariable Long blockedId) {
        resourceService.unblock(type, id, blockedId);
        return MessageResponse.of("Day made available again");
    }
}
