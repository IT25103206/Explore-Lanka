package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.InvoiceResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.PaymentService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService.RefundResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** BookingController for tourists (UC-06 Book Tour Package, PBI-05 / PBI-06). */
@RestController
@RequestMapping("/api/customer")
@PreAuthorize(Access.CUSTOMER)
public class CustomerBookingController {

    private final BookingService bookingService;
    private final PaymentService paymentService;
    private final RefundService refundService;
    private final CurrentUser currentUser;

    public CustomerBookingController(BookingService bookingService, PaymentService paymentService,
                                     RefundService refundService, CurrentUser currentUser) {
        this.bookingService = bookingService;
        this.paymentService = paymentService;
        this.refundService = refundService;
        this.currentUser = currentUser;
    }

    @GetMapping("/bookings/options")
    public BookingOptions options(@RequestParam Long packageId,
                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                  @RequestParam(defaultValue = "2") int adults,
                                  @RequestParam(defaultValue = "0") int children,
                                  @RequestParam(defaultValue = "0") int extraDays,
                                  @RequestParam(required = false) String guideLanguage) {
        return bookingService.options(packageId, startDate, adults, children, extraDays, guideLanguage);
    }

    @PostMapping("/bookings/quote")
    public QuoteResponse quote(@Valid @RequestBody BookingRequest request) {
        return bookingService.quote(request, currentUser.entity());
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@Valid @RequestBody BookingRequest request) {
        return bookingService.create(request, currentUser.entity());
    }

    @GetMapping("/bookings")
    public List<BookingResponse> mine() {
        return bookingService.myBookings(currentUser.entity());
    }

    @GetMapping("/bookings/{id}")
    public BookingResponse get(@PathVariable Long id) {
        return bookingService.myBooking(id, currentUser.entity());
    }

    @PutMapping("/bookings/{id}")
    public BookingResponse modify(@PathVariable Long id, @Valid @RequestBody BookingRequest request) {
        return bookingService.modifyPending(id, request, currentUser.entity());
    }

    @PutMapping("/bookings/{id}/travellers")
    public BookingResponse updateTravellers(@PathVariable Long id, @Valid @RequestBody TravellerUpdateRequest request) {
        return bookingService.updateTravellers(id, request, currentUser.entity());
    }

    @PostMapping("/bookings/{id}/cancel")
    public BookingResponse cancel(@PathVariable Long id, @Valid @RequestBody CancelRequest request) {
        return bookingService.cancelByCustomer(id, request.reason().trim(), currentUser.entity());
    }

    @PostMapping("/bookings/{id}/payments")
    public MessageResponse pay(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        PaymentResponse payment = paymentService.pay(id, request, currentUser.entity());
        String msg = switch (payment.status()) {
            case SUCCESS -> "Payment successful - your booking is confirmed!";
            case PENDING -> "Transfer recorded. Your booking will be confirmed once our finance team verifies it.";
            default -> "Payment processed";
        };
        return MessageResponse.of(msg, payment);
    }

    @GetMapping("/bookings/{id}/invoice")
    public InvoiceResponse invoice(@PathVariable Long id) {
        return paymentService.invoice(id, currentUser.entity());
    }

    @GetMapping("/payments")
    public List<PaymentResponse> payments() {
        return paymentService.forCustomer(currentUser.id());
    }

    @GetMapping("/refunds")
    public List<RefundResponse> refunds() {
        return refundService.forCustomer(currentUser.id());
    }
}
