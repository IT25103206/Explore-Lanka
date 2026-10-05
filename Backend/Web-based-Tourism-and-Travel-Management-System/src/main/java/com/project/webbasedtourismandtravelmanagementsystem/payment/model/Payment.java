package com.project.webbasedtourismandtravelmanagementsystem.payment.model;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One payment attempt (simulated gateway - no real card data is stored). */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment extends BaseEntity {

    public enum Method { CARD, BANK_TRANSFER, EZ_CASH }

    public enum Status { SUCCESS, PENDING, FAILED, REFUNDED }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Method method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "transaction_ref", nullable = false, unique = true, length = 40)
    private String transactionRef;

    /** e.g. "VISA **** 4242" or "eZ Cash 077***4567". */
    @Column(name = "masked_details", length = 60)
    private String maskedDetails;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "verified_by", length = 120)
    private String verifiedBy;
}
