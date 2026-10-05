package com.project.webbasedtourismandtravelmanagementsystem.partner.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One version of a service rate (e.g. "Deluxe room per night").
 * A change of more than 20% is stored as PENDING_APPROVAL and only the System Administrator
 * can approve it. Approved rates can be linked to a hotel, vehicle or guide so the
 * booking prices update automatically.
 */
@Entity
@Table(name = "service_rates")
@Getter
@Setter
@NoArgsConstructor
public class ServiceRate extends BaseEntity {

    public enum Status { ACTIVE, PENDING_APPROVAL, SUPERSEDED, REJECTED }

    public enum Unit { PER_NIGHT, PER_DAY, PER_PERSON, PER_KM, PER_TRIP }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Unit unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "previous_amount", precision = 12, scale = 2)
    private BigDecimal previousAmount;

    @Column(name = "change_percent", precision = 7, scale = 2)
    private BigDecimal changePercent;

    @Column(nullable = false)
    private int version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    /** Optional link to the resource whose price this rate controls. */
    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", length = 20)
    private ResourceType resourceType;

    @Column(name = "resource_id")
    private Long resourceId;

    @Column(name = "requested_by", length = 120)
    private String requestedBy;

    @Column(name = "decided_by", length = 120)
    private String decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decision_note", length = 300)
    private String decisionNote;
}
