package com.project.webbasedtourismandtravelmanagementsystem.payment.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Invoice;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.InvoiceRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.PaymentRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.strategy.PaymentStrategy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/** Payment Management minor function: pay, verify bank transfers, invoices, payment history. */
@Service
@Transactional
public class PaymentService {

    private final SecureRandom random = new SecureRandom();
    private final Map<Payment.Method, PaymentStrategy> strategies = new EnumMap<>(Payment.Method.class);

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final BookingService bookingService;

    public PaymentService(List<PaymentStrategy> strategyList, PaymentRepository paymentRepository,
                          InvoiceRepository invoiceRepository, BookingService bookingService) {
        strategyList.forEach(s -> strategies.put(s.method(), s));
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.bookingService = bookingService;
    }

    /**
     * UC-06 step 7: the tourist pays. Card / eZ Cash confirm immediately; bank transfers wait for
     * Finance. A declined payment is saved as FAILED and the tourist may retry (7a).
     */
    @Transactional(noRollbackFor = PaymentDeclinedException.class)
    public PaymentResponse pay(Long bookingId, PaymentRequest req, User customer) {
        Booking b = bookingService.find(bookingId);
        if (!b.getCustomer().getId().equals(customer.getId())) {
            throw new NotFoundException("Booking", bookingId);
        }
        if (b.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new BusinessException("This booking does not need a payment (status " + b.getStatus() + ")");
        }
        if (!b.getStartDate().isAfter(LocalDate.now())) {
            throw new BusinessException("The travel date has passed - this booking can no longer be paid");
        }
        List<String> issues = bookingService.availabilityIssues(b);
        if (!issues.isEmpty()) {
            throw BusinessException.conflict("Sorry - some of your selections were booked by someone else. Please modify your booking before paying.", issues);
        }

        PaymentStrategy strategy = strategies.get(req.method());
        strategy.validate(req);
        PaymentResult result = strategy.process(req, b.getTotalAmount());

        Payment p = new Payment();
        p.setBooking(b);
        p.setAmount(b.getTotalAmount());
        p.setMethod(req.method());
        p.setStatus(result.status());
        p.setMaskedDetails(result.maskedDetails());
        p.setFailureReason(result.failureReason());
        p.setTransactionRef(newTransactionRef());
        paymentRepository.save(p);

        switch (result.status()) {
            case SUCCESS -> {
                p.setPaidAt(LocalDateTime.now());
                bookingService.confirmAfterPayment(b);
                createInvoice(b, p);
            }
            case PENDING -> bookingService.markAwaitingVerification(b);
            case FAILED -> throw new PaymentDeclinedException(result.failureReason());
            default -> throw new IllegalStateException("Unexpected payment result " + result.status());
        }
        return PaymentResponse.from(p);
    }

    /** Finance & Booking Coordinator confirms or rejects a bank transfer. */
    public PaymentResponse verifyBankTransfer(Long paymentId, boolean approve, String note, String actor) {
        Payment p = paymentRepository.findById(paymentId).orElseThrow(() -> new NotFoundException("Payment", paymentId));
        if (p.getStatus() != Payment.Status.PENDING) {
            throw new BusinessException("Only pending bank transfers can be verified");
        }
        Booking b = p.getBooking();
        if (b.getStatus() != BookingStatus.AWAITING_VERIFICATION) {
            throw new BusinessException("Booking " + b.getReference() + " is " + b.getStatus() + " and no longer awaits verification");
        }
        p.setVerifiedBy(actor);
        if (approve) {
            p.setStatus(Payment.Status.SUCCESS);
            p.setPaidAt(LocalDateTime.now());
            bookingService.confirmAfterPayment(b);
            createInvoice(b, p);
        } else {
            if (note == null || note.isBlank()) {
                throw new BusinessException("Give a reason for rejecting the transfer");
            }
            p.setStatus(Payment.Status.FAILED);
            p.setFailureReason(note.trim());
            bookingService.revertToPendingPayment(b, note.trim());
        }
        return PaymentResponse.from(p);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> all() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream().map(PaymentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> forCustomer(Long customerId) {
        return paymentRepository.findByBookingCustomerIdOrderByCreatedAtDesc(customerId).stream().map(PaymentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse invoice(Long bookingId, User viewer) {
        Booking b = bookingService.find(bookingId);
        if (!viewer.getRole().isStaff() && !b.getCustomer().getId().equals(viewer.getId())) {
            throw new NotFoundException("Booking", bookingId);
        }
        Invoice inv = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BusinessException("An invoice is issued once the payment is confirmed"));
        List<InvoiceLine> lines = new ArrayList<>();
        lines.add(new InvoiceLine(b.getTourPackage().getName() + " - " + b.getAdults() + " adult(s)"
                + (b.getChildren() > 0 ? ", " + b.getChildren() + " child(ren)" : "")
                + (b.getExtraDays() > 0 ? ", +" + b.getExtraDays() + " extra day(s)" : ""), b.getPackageCost()));
        if (b.getAccommodationCost().signum() > 0) {
            lines.add(new InvoiceLine("Accommodation: " + b.getPreferredHotel().getName() + " - " + b.getRooms()
                    + " room(s) x " + b.nights() + " night(s)", b.getAccommodationCost()));
        }
        if (b.getTransportCost().signum() > 0) {
            lines.add(new InvoiceLine("Transport: " + b.getPreferredVehicle().label() + " x " + (b.nights() + 1) + " day(s)", b.getTransportCost()));
        }
        if (b.getGuideCost().signum() > 0) {
            lines.add(new InvoiceLine("Licensed tour guide x " + (b.nights() + 1) + " day(s)", b.getGuideCost()));
        }
        Payment pay = inv.getPayment();
        return new InvoiceResponse(inv.getInvoiceNo(), inv.getCreatedAt(), b.getReference(), b.getCustomer().getFullName(),
                b.getCustomer().getEmail(), b.getTourPackage().getName(), b.getStartDate(), b.getEndDate(), b.getAdults(),
                b.getChildren(), lines, inv.getSubtotal(), inv.getDiscount(), b.getPromoCode(), inv.getTotal(),
                pay == null ? null : pay.getMethod().name(), pay == null ? null : pay.getTransactionRef(),
                pay == null ? null : pay.getPaidAt());
    }

    private void createInvoice(Booking b, Payment p) {
        if (invoiceRepository.findByBookingId(b.getId()).isPresent()) {
            return;
        }
        Invoice inv = new Invoice();
        inv.setBooking(b);
        inv.setPayment(p);
        inv.setSubtotal(b.getSubtotal());
        inv.setDiscount(b.getDiscountAmount() == null ? BigDecimal.ZERO : b.getDiscountAmount());
        inv.setTotal(b.getTotalAmount());
        inv.setInvoiceNo("INV-" + LocalDate.now().getYear() + "-" + b.getReference().substring(2));
        invoiceRepository.save(inv);
    }

    private String newTransactionRef() {
        return "PAY-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase(Locale.ROOT)
                + "-" + String.format("%04d", random.nextInt(10000));
    }
}
