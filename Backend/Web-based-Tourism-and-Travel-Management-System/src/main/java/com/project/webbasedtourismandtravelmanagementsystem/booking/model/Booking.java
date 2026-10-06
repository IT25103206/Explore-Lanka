package com.project.webbasedtourismandtravelmanagementsystem.booking.model;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Hotel;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Vehicle;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
public class Booking extends BaseEntity {

    /** Customers may modify or cancel up to this many days before the travel date. */
    public static final int CHANGE_DEADLINE_DAYS = 7;

    @Column(nullable = false, unique = true, length = 20)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private TourPackage tourPackage;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private int adults;

    @Column(nullable = false)
    private int children;

    @Column(name = "extra_days", nullable = false)
    private int extraDays;

    @Column(nullable = false)
    private int rooms;

    // ---- tourist preferences (PBI-02) - allocated automatically after payment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_hotel_id")
    private Hotel preferredHotel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_vehicle_id")
    private Vehicle preferredVehicle;

    @Column(name = "guide_required", nullable = false)
    private boolean guideRequired;

    @Column(name = "guide_language", length = 40)
    private String guideLanguage;

    @Column(name = "special_requests", length = 1000)
    private String specialRequests;

    // ---- cost breakdown (stored so later price changes never affect existing bookings)
    @Column(name = "package_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal packageCost;

    @Column(name = "accommodation_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal accommodationCost;

    @Column(name = "transport_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal transportCost;

    @Column(name = "guide_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal guideCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    private Promotion promotion;

    @Column(name = "promo_code", length = 30)
    private String promoCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<TravelerDetail> travelers = new ArrayList<>();

    public int travellerCount() {
        return adults + children;
    }

    public int nights() {
        return (int) ChronoUnit.DAYS.between(startDate, endDate);
    }

    public long daysUntilTravel() {
        return ChronoUnit.DAYS.between(LocalDate.now(), startDate);
    }

    /** UC-06 decision: changes are allowed until 7 days before the travel date. */
    public boolean withinChangeWindow() {
        return daysUntilTravel() >= CHANGE_DEADLINE_DAYS;
    }

    public void replaceTravelers(List<TravelerDetail> list) {
        travelers.clear();
        for (TravelerDetail t : list) {
            t.setBooking(this);
            travelers.add(t);
        }
    }
}
