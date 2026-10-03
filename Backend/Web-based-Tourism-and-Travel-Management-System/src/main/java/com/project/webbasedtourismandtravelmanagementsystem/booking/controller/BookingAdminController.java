package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Booking management for administrators.
 */
@RestController
@RequestMapping("/api/admin/bookings")
public class BookingAdminController {

    private final BookingService bookingService;

    public BookingAdminController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Get all bookings.
     */
    @GetMapping
    @PreAuthorize(Access.BOOKINGS)
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    /**
     * Get one booking.
     */
    @GetMapping("/{id}")
    @PreAuthorize(Access.BOOKINGS)
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    /**
     * Update booking.
     */
    @PutMapping("/{id}")
    @PreAuthorize(Access.BOOKINGS)
    public Booking updateBooking(
            @PathVariable Long id,
            @RequestBody Booking booking) {

        return bookingService.updateBooking(id, booking);
    }

    /**
     * Delete booking.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize(Access.BOOKINGS)
    public void deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
    }
}