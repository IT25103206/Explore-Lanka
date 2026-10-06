package com.project.webbasedtourismandtravelmanagementsystem.feedback.model;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Post-tour rating and review, linked to a completed booking (PBI-08). */
@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
public class Feedback extends BaseEntity {

    public enum Status { NEW, RESPONDED, HIDDEN }

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private TourPackage tourPackage;

    @Column(name = "overall_rating", nullable = false)
    private int overallRating;

    @Column(name = "hotel_rating")
    private Integer hotelRating;

    @Column(name = "transport_rating")
    private Integer transportRating;

    @Column(name = "guide_rating")
    private Integer guideRating;

    @Column(nullable = false, length = 2000)
    private String comment;

    @Column(nullable = false)
    private boolean complaint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.NEW;

    @Column(length = 1000)
    private String response;

    @Column(name = "responded_by", length = 120)
    private String respondedBy;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
}
