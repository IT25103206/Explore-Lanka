package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDTO;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.config.RoleAuthorizationInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ================= ADMIN / GENERAL =================

    // CREATE BOOKING (raw entity - used by admin)
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        return bookingService.createBooking(booking);
    }

    // GET ALL BOOKINGS
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // GET BOOKING BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id, HttpServletRequest request) {
        try {
            Booking booking = bookingService.getBookingById(id);

            if (isCustomer(request) && (booking.getCustomer() == null
                    || !sessionUserId(request).equals(booking.getCustomer().getUserId()))) {
                return error(HttpStatus.FORBIDDEN, "Access denied. You can only view your own bookings.");
            }

            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return error(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // UPDATE BOOKING
    @PutMapping("/{id}")
    public Booking updateBooking(@PathVariable Long id, @RequestBody Booking booking) {
        return bookingService.updateBooking(id, booking);
    }

    // DELETE BOOKING
    @DeleteMapping("/{id}")
    public String deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return "Booking deleted successfully";
    }

    // ================= CUSTOMER SIDE =================

    // Customer creates a booking: { customerId, packageId, travelDate, numberOfPeople, pickupLocation, specialRequests }
    @PostMapping("/request")
    public ResponseEntity<?> createCustomerBooking(@RequestBody BookingDTO dto,
                                                   HttpServletRequest request) {
        try {
            dto.setCustomerId(sessionUserId(request));
            Booking saved = bookingService.createCustomerBooking(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // Logged-in customer's bookings
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerBookings(@PathVariable Long customerId,
                                                 HttpServletRequest request) {
        Long loggedInCustomerId = sessionUserId(request);
        if (!loggedInCustomerId.equals(customerId)) {
            return error(HttpStatus.FORBIDDEN, "Access denied. You can only view your own bookings.");
        }
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(loggedInCustomerId));
    }

    // Customer cancels own booking
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id,
                                           @RequestParam(required = false) Long customerId,
                                           HttpServletRequest request) {
        try {
            Long loggedInCustomerId = sessionUserId(request);
            if (customerId != null && !customerId.equals(loggedInCustomerId)) {
                return error(HttpStatus.FORBIDDEN, "Access denied. You can only cancel your own bookings.");
            }
            return ResponseEntity.ok(bookingService.cancelBooking(id, loggedInCustomerId));
        } catch (IllegalArgumentException e) {
            return error(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            return error(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", message));
    }

    private Long sessionUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new IllegalArgumentException("Please log in again.");
        }
        Object value = session.getAttribute(RoleAuthorizationInterceptor.USER_ID);
        if (value instanceof Long longValue) {
            return longValue;
        }
        if (value == null) {
            throw new IllegalArgumentException("Please log in again.");
        }
        return Long.valueOf(value.toString());
    }

    private boolean isCustomer(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object value = session == null ? null : session.getAttribute(RoleAuthorizationInterceptor.USER_ROLE);
        return value != null && "CUSTOMER".equalsIgnoreCase(value.toString());
    }
}
