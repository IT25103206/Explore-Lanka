package com.project.webbasedtourismandtravelmanagementsystem.event.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.event.dto.EventDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import com.project.webbasedtourismandtravelmanagementsystem.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
public class EventController {

    private final EventService eventService;
    private final CurrentUser currentUser;

    public EventController(EventService eventService, CurrentUser currentUser) {
        this.eventService = eventService;
        this.currentUser = currentUser;
    }

    // ---------------------------------------------------------------- guests and tourists

    @GetMapping("/api/public/events")
    public List<EventResponse> upcoming(@RequestParam(required = false) String region,
                                        @RequestParam(required = false) EventFestival.Category category,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                        @RequestParam(required = false) String q) {
        return eventService.upcoming(region, category, from, to, q);
    }

    @GetMapping("/api/public/events/{id}")
    public EventResponse details(@PathVariable Long id) {
        return eventService.publicDetails(id);
    }

    @GetMapping("/api/public/packages/{packageId}/events")
    public List<EventResponse> forPackage(@PathVariable Long packageId,
                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return eventService.forPackage(packageId, date);
    }

    @PostMapping("/api/customer/events/{id}/register")
    @PreAuthorize(Access.CUSTOMER)
    public RegistrationResponse register(@PathVariable Long id, @Valid @RequestBody RegistrationRequest request) {
        return eventService.register(id, request.participants(), currentUser.entity());
    }

    @DeleteMapping("/api/customer/events/{id}/register")
    @PreAuthorize(Access.CUSTOMER)
    public MessageResponse cancelRegistration(@PathVariable Long id) {
        eventService.cancelRegistration(id, currentUser.entity());
        return MessageResponse.of("Registration cancelled");
    }

    @GetMapping("/api/customer/events/registrations")
    @PreAuthorize(Access.CUSTOMER)
    public List<RegistrationResponse> myRegistrations() {
        return eventService.myRegistrations(currentUser.entity());
    }

    // ---------------------------------------------------------------- Marketing Executive - Events (Event Organizer)

    @GetMapping("/api/admin/events")
    @PreAuthorize(Access.EVENTS)
    public List<EventResponse> list() {
        return eventService.listAll();
    }

    @GetMapping("/api/admin/events/{id}")
    @PreAuthorize(Access.EVENTS)
    public EventResponse get(@PathVariable Long id) {
        return eventService.get(id);
    }

    @PostMapping("/api/admin/events")
    @PreAuthorize(Access.EVENTS)
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@Valid @RequestBody EventRequest request) {
        return eventService.create(request, currentUser.details().getFullName());
    }

    @PutMapping("/api/admin/events/{id}")
    @PreAuthorize(Access.EVENTS)
    public EventResponse update(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return eventService.update(id, request);
    }

    @PostMapping("/api/admin/events/{id}/publish")
    @PreAuthorize(Access.EVENTS)
    public EventResponse publish(@PathVariable Long id) {
        return eventService.publish(id);
    }

    @PostMapping("/api/admin/events/{id}/deactivate")
    @PreAuthorize(Access.EVENTS)
    public EventResponse deactivate(@PathVariable Long id) {
        return eventService.deactivate(id);
    }

    @DeleteMapping("/api/admin/events/{id}")
    @PreAuthorize(Access.EVENTS)
    public MessageResponse delete(@PathVariable Long id) {
        eventService.delete(id);
        return MessageResponse.of("Event deleted");
    }

    @GetMapping("/api/admin/events/{id}/registrations")
    @PreAuthorize(Access.EVENTS)
    public List<RegistrationResponse> registrations(@PathVariable Long id) {
        return eventService.registrations(id);
    }
}
