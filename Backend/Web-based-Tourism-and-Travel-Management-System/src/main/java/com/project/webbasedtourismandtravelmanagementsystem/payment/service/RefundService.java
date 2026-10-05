package com.project.webbasedtourismandtravelmanagementsystem.payment.service;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Refund;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.PaymentRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.RefundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** Refund requests created on cancellation and processed by the Finance & Booking Coordinator. */
@Service
@Transactional
public class RefundService {

    public record RefundResponse(Long id, Long bookingId, String bookingReference, String customerName,
                                 BigDecimal amount, String reason, Refund.Status status, String processedBy,
                                 LocalDateTime processedAt, String financeNote, LocalDateTime createdAt,
                                 String paymentRef, Payment.Method method) {
        public static RefundResponse from(Refund r) {
            return new RefundResponse(r.getId(), r.getBooking().getId(), r.getBooking().getReference(),
                    r.getBooking().getCustomer().getFullName(), r.getAmount(), r.getReason(), r.getStatus(),
                    r.getProcessedBy(), r.getProcessedAt(), r.getFinanceNote(), r.getCreatedAt(),
                    r.getPayment().getTransactionRef(), r.getPayment().getMethod());
        }
    }

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    public RefundService(RefundRepository refundRepository, PaymentRepository paymentRepository,
                         NotificationService notificationService) {
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
    }

    public Optional<Payment> successfulPayment(Long bookingId) {
        return paymentRepository.findFirstByBookingIdAndStatusOrderByCreatedAtDesc(bookingId, Payment.Status.SUCCESS);
    }

    /** UC-06 decision: cancelling a paid booking (7+ days before travel) creates a full refund request. */
    public Refund requestRefund(Booking booking, Payment payment, String reason) {
        Refund r = new Refund();
        r.setBooking(booking);
        r.setPayment(payment);
        r.setAmount(payment.getAmount());
        r.setReason(reason);
        return refundRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> list() {
        return refundRepository.findAllByOrderByCreatedAtDesc().stream().map(RefundResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> forCustomer(Long customerId) {
        return refundRepository.findByBookingCustomerIdOrderByCreatedAtDesc(customerId).stream().map(RefundResponse::from).toList();
    }

    public RefundResponse process(Long id, boolean approve, String note, String actor) {
        Refund r = refundRepository.findById(id).orElseThrow(() -> new NotFoundException("Refund", id));
        if (r.getStatus() != Refund.Status.PENDING) {
            throw new BusinessException("This refund has already been " + r.getStatus().name().toLowerCase());
        }
        if (!approve && (note == null || note.isBlank())) {
            throw new BusinessException("Give a reason when rejecting a refund");
        }
        r.setStatus(approve ? Refund.Status.APPROVED : Refund.Status.REJECTED);
        r.setProcessedBy(actor);
        r.setProcessedAt(LocalDateTime.now());
        r.setFinanceNote(note);
        if (approve) {
            r.getPayment().setStatus(Payment.Status.REFUNDED);
        }
        notificationService.notify(r.getBooking().getCustomer(), Notification.Type.PAYMENT,
                approve ? "Refund approved" : "Refund update",
                approve ? "LKR " + r.getAmount().toPlainString() + " for booking " + r.getBooking().getReference()
                        + " will be returned to your original payment method within 7 working days."
                        : "Your refund for " + r.getBooking().getReference() + " was not approved: " + note,
                "/customer/payments.html");
        return RefundResponse.from(r);
    }
}
