package com.project.webbasedtourismandtravelmanagementsystem.partner.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One version of a partner contract. Changing the terms never overwrites a row:
 * a new version is stored and the previous one becomes SUPERSEDED (version history).
 */
@Entity
@Table(name = "supplier_contracts")
@Getter
@Setter
@NoArgsConstructor
public class SupplierContract extends BaseEntity {

    public enum Status { ACTIVE, SUPERSEDED, TERMINATED }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(nullable = false)
    private int version;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "commission_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionPercent;

    @Column(name = "payment_terms", length = 120)
    private String paymentTerms;

    @Column(nullable = false, length = 2000)
    private String terms;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "created_by", length = 120)
    private String createdBy;
}
