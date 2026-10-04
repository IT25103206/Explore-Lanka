package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.BookingResponse;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.CancelRequest;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.ItineraryResponse;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService.BookingFilter;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.InvoiceResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Booking management for the Finance & Booking Coordinator and Tour Operations Manager. */
@RestController
public class BookingAdminController {

    private final BookingService bookingService;
    private final PaymentService paymentService;
    private final CurrentUser currentUser;

    public BookingAdminController(BookingService bookingService, PaymentService paymentService, CurrentUser currentUser) {
        this.bookingService = bookingService;
        this.paymentService = paymentService;
        this.currentUser = currentUser;
    }

    @GetMapping("/api/admin/bookings")
    @PreAuthorize(Access.BOOKINGS)
    public List<BookingResponse> list(@RequestParam(required = false) BookingStatus status,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return bookingService.list(new BookingFilter(status, q, from, to));
    }

    @GetMapping("/api/admin/bookings/{id}")
    @PreAuthorize(Access.BOOKINGS)
    public BookingResponse get(@PathVariable Long id) {
        return bookingService.get(id);
    }

    @PostMapping("/api/admin/bookings/{id}/cancel")
    @PreAuthorize(Access.BOOKINGS)
    public BookingResponse cancel(@PathVariable Long id, @Valid @RequestBody CancelRequest request) {
        return bookingService.cancelByStaff(id, request.reason().trim(), currentUser.details().getFullName());
    }

    @PostMapping("/api/admin/bookings/{id}/complete")
    @PreAuthorize(Access.BOOKINGS)
    public BookingResponse complete(@PathVariable Long id) {
        return bookingService.completeByStaff(id);
    }

    @GetMapping("/api/admin/bookings/{id}/invoice")
    @PreAuthorize(Access.BOOKINGS)
    public InvoiceResponse invoice(@PathVariable Long id) {
        return paymentService.invoice(id, currentUser.entity());
    }

    /** Itinerary for the customer, staff, or the partner/guide assigned to the booking. */
    @GetMapping("/api/itineraries/{bookingId}")
    public ItineraryResponse itinerary(@PathVariable Long bookingId) {
        return bookingService.itinerary(bookingId, currentUser.entity());
    }
}
