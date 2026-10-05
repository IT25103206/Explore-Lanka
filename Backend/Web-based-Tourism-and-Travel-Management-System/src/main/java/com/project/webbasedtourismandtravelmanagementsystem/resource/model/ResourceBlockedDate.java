package com.project.webbasedtourismandtravelmanagementsystem.resource.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** A day on which a vehicle or guide is not available (maintenance, leave, ...). */
@Entity
@Table(name = "resource_blocked_dates",
        uniqueConstraints = @UniqueConstraint(name = "uk_resource_block",
                columnNames = {"resource_type", "resource_id", "blocked_date"}))
@Getter
@Setter
@NoArgsConstructor
public class ResourceBlockedDate extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 20)
    private ResourceType resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "blocked_date", nullable = false)
    private LocalDate date;

    @Column(length = 200)
    private String reason;

    public ResourceBlockedDate(ResourceType type, Long resourceId, LocalDate date, String reason) {
        this.resourceType = type;
        this.resourceId = resourceId;
        this.date = date;
        this.reason = reason;
    }
}
