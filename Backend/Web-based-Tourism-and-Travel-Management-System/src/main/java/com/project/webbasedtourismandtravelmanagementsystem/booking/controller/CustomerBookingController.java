package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDTO;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.InvoiceResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.PaymentService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService.RefundResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize(Access.CUSTOMER)
public class CustomerBookingController {

    private final BookingService bookingService;
    private final PaymentService paymentService;
    private final RefundService refundService;
    private final CurrentUser currentUser;


    public CustomerBookingController(
            BookingService bookingService,
            PaymentService paymentService,
            RefundService refundService,
            CurrentUser currentUser) {

        this.bookingService = bookingService;
        this.paymentService = paymentService;
        this.refundService = refundService;
        this.currentUser = currentUser;
    }


    // =========================================================
    // CREATE CUSTOMER BOOKING
    // =========================================================

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public Booking create(
            @RequestBody BookingDTO request) {

        /*
         * Always use the currently logged-in customer.
         */
        request.setCustomerId(
                currentUser.id()
        );

        return bookingService
                .createCustomerBooking(
                        request
                );
    }


    // =========================================================
    // CUSTOMER BOOKING LIST
    // =========================================================

    @GetMapping("/bookings")
    public List<Booking> mine() {

        return bookingService
                .getBookingsByCustomer(
                        currentUser.id()
                );
    }


    // =========================================================
    // GET ONE CUSTOMER BOOKING
    // =========================================================

    @GetMapping("/bookings/{id}")
    public Booking get(
            @PathVariable Long id) {

        Booking booking =
                bookingService
                        .getBookingById(id);

        verifyOwnership(
                booking
        );

        return booking;
    }


    // =========================================================
    // UPDATE CUSTOMER BOOKING
    // =========================================================

    @PutMapping("/bookings/{id}")
    public Booking modify(
            @PathVariable Long id,
            @RequestBody Booking request) {

        Booking existing =
                bookingService
                        .getBookingById(id);

        verifyOwnership(
                existing
        );

        /*
         * Preserve fields that should not be changed
         * by the customer through this endpoint.
         */
        request.setBookingId(
                existing.getBookingId()
        );

        request.setCustomer(
                existing.getCustomer()
        );

        request.setTourPackage(
                existing.getTourPackage()
        );

        if (request.getBookingDate() == null) {

            request.setBookingDate(
                    existing.getBookingDate()
            );
        }

        if (request.getStatus() == null) {

            request.setStatus(
                    existing.getStatus()
            );
        }

        if (request.getTotalAmount() == null) {

            request.setTotalAmount(
                    existing.getTotalAmount()
            );
        }

        return bookingService
                .updateBooking(
                        id,
                        request
                );
    }


    // =========================================================
    // CANCEL BOOKING
    // =========================================================

    @PostMapping("/bookings/{id}/cancel")
    public Booking cancel(
            @PathVariable Long id) {

        return bookingService
                .cancelBooking(
                        id,
                        currentUser.id()
                );
    }


    // =========================================================
    // MAKE PAYMENT
    // =========================================================

    @PostMapping("/bookings/{id}/payments")
    public MessageResponse pay(
            @PathVariable Long id,
            @RequestBody PaymentRequest request) {

        Booking booking =
                bookingService
                        .getBookingById(id);

        verifyOwnership(
                booking
        );


        PaymentResponse payment =
                paymentService.pay(
                        id,
                        request,
                        currentUser.entity()
                );


        String message;

        switch (payment.status()) {

            case SUCCESS ->
                    message =
                            "Payment successful - your booking is confirmed!";

            case PENDING ->
                    message =
                            "Transfer recorded. Your booking will be confirmed once our finance team verifies it.";

            default ->
                    message =
                            "Payment processed";
        }


        return MessageResponse.of(
                message,
                payment
        );
    }


    // =========================================================
    // INVOICE
    // =========================================================

    @GetMapping("/bookings/{id}/invoice")
    public InvoiceResponse invoice(
            @PathVariable Long id) {

        Booking booking =
                bookingService
                        .getBookingById(id);

        verifyOwnership(
                booking
        );

        return paymentService
                .invoice(
                        id,
                        currentUser.entity()
                );
    }


    // =========================================================
    // CUSTOMER PAYMENTS
    // =========================================================

    @GetMapping("/payments")
    public List<PaymentResponse> payments() {

        return paymentService
                .forCustomer(
                        currentUser.id()
                );
    }


    // =========================================================
    // CUSTOMER REFUNDS
    // =========================================================

    @GetMapping("/refunds")
    public List<RefundResponse> refunds() {

        return refundService
                .forCustomer(
                        currentUser.id()
                );
    }


    // =========================================================
    // OWNERSHIP CHECK
    // =========================================================

    private void verifyOwnership(
            Booking booking) {

        if (booking == null
                || booking.getCustomer() == null
                || booking.getCustomer().getUserId() == null
                || currentUser.id() == null
                || !booking
                .getCustomer()
                .getUserId()
                .equals(
                        currentUser.id()
                )) {

            throw new IllegalArgumentException(
                    "You can only access your own booking."
            );
        }
    }
}