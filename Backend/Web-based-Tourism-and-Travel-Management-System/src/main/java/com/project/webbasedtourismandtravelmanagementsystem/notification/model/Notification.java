package com.project.webbasedtourismandtravelmanagementsystem.notification.model;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {

    public enum Type { BOOKING, PAYMENT, ALLOCATION, SCHEDULE, PROMOTION, EVENT, RATE, FEEDBACK, SYSTEM }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    /** Page the notification points to, e.g. "/customer/bookings.html". */
    @Column(length = 200)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;
}
