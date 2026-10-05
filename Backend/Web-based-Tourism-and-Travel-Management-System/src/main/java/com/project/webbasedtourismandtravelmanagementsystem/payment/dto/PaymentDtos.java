package com.project.webbasedtourismandtravelmanagementsystem.payment.dto;

import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    /** Fields depend on the method; each PaymentStrategy validates the ones it needs. */
    public record PaymentRequest(
            @NotNull(message = "Choose a payment method") Payment.Method method,
            @Size(max = 100) String cardHolder,
            @Size(max = 25) String cardNumber,
            @Size(max = 5) String expiry,
            @Size(max = 4) String cvv,
            @Size(max = 60) String bankName,
            @Size(max = 30) String bankReference,
            @Size(max = 15) String mobileNumber,
            @Size(max = 6) String pin) {
    }

    /** What a payment strategy reports back (simulated gateway). */
    public record PaymentResult(Payment.Status status, String maskedDetails, String failureReason) {
        public static PaymentResult success(String masked) {
            return new PaymentResult(Payment.Status.SUCCESS, masked, null);
        }

        public static PaymentResult pending(String masked) {
            return new PaymentResult(Payment.Status.PENDING, masked, null);
        }

        public static PaymentResult failed(String masked, String reason) {
            return new PaymentResult(Payment.Status.FAILED, masked, reason);
        }
    }

    public record PaymentResponse(Long id, Long bookingId, String bookingReference, String customerName,
                                  BigDecimal amount, Payment.Method method, Payment.Status status, String transactionRef,
                                  String maskedDetails, String failureReason, LocalDateTime paidAt, String verifiedBy,
                                  LocalDateTime createdAt) {
        public static PaymentResponse from(Payment p) {
            return new PaymentResponse(p.getId(), p.getBooking().getId(), p.getBooking().getReference(),
                    p.getBooking().getCustomer().getFullName(), p.getAmount(), p.getMethod(), p.getStatus(),
                    p.getTransactionRef(), p.getMaskedDetails(), p.getFailureReason(), p.getPaidAt(), p.getVerifiedBy(),
                    p.getCreatedAt());
        }
    }

    public record VerifyRequest(boolean approve, @Size(max = 255) String note) {
    }

    public record RefundDecision(boolean approve, @Size(max = 300) String note) {
    }

    public record InvoiceLine(String description, BigDecimal amount) {
    }

    public record InvoiceResponse(String invoiceNo, LocalDateTime issuedAt, String bookingReference, String customerName,
                                  String customerEmail, String packageName, LocalDate startDate, LocalDate endDate,
                                  int adults, int children, List<InvoiceLine> lines, BigDecimal subtotal,
                                  BigDecimal discount, String promoCode, BigDecimal total, String paymentMethod,
                                  String transactionRef, LocalDateTime paidAt) {
    }
}
