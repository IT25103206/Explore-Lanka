package com.project.webbasedtourismandtravelmanagementsystem.event.model;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A tourist's registration for an event (used to enforce the maximum participants). */
@Entity
@Table(name = "event_registrations",
        uniqueConstraints = @UniqueConstraint(name = "uk_event_customer", columnNames = {"event_id", "customer_id"}))
@Getter
@Setter
@NoArgsConstructor
public class EventRegistration extends BaseEntity {

    public enum Status { REGISTERED, CANCELLED }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private EventFestival event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false)
    private int participants;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.REGISTERED;
}
