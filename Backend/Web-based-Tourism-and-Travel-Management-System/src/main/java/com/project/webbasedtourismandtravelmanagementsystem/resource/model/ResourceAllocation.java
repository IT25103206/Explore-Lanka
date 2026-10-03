package com.project.webbasedtourismandtravelmanagementsystem.resource.model;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** A hotel, vehicle or guide assigned to a confirmed booking for its travel dates (UC-01). */
@Entity
@Table(name = "resource_allocations")
@Getter
@Setter
@NoArgsConstructor
public class ResourceAllocation extends BaseEntity {

    public enum Status { ALLOCATED, RELEASED }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 20)
    private ResourceType resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    /** Name at the time of allocation, so history stays readable. */
    @Column(name = "resource_name", nullable = false, length = 150)
    private String resourceName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** Number of rooms (hotels only). */
    @Column(nullable = false)
    private int quantity = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ALLOCATED;

    @Column(name = "allocated_by", length = 120)
    private String allocatedBy;
}
