package com.project.webbasedtourismandtravelmanagementsystem.promotion.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

/** A promotional campaign / special offer with a coupon code (UC-05). */
@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
public class Promotion extends BaseEntity {

    public enum OfferType { EARLY_BIRD, HONEYMOON, FAMILY, SUMMER, GROUP, FESTIVAL_SEASON, GENERAL }

    public enum DiscountType { PERCENTAGE, FIXED_AMOUNT }

    /** DRAFT = not visible, ACTIVE = published, INACTIVE = deactivated, EXPIRED = end date passed. */
    public enum Status { DRAFT, ACTIVE, INACTIVE, EXPIRED }

    public enum Audience { ALL_CUSTOMERS, NEW_CUSTOMERS, RETURNING_CUSTOMERS, LOCAL_RESIDENTS, INTERNATIONAL, FAMILIES, GROUPS }

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false, length = 20)
    private OfferType offerType;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    /** Upper limit for percentage discounts (optional). */
    @Column(name = "max_discount", precision = 12, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_spend", precision = 12, scale = 2)
    private BigDecimal minSpend;

    @Column(name = "coupon_code", nullable = false, unique = true, length = 30)
    private String couponCode;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    /** Confirmed bookings that used this promotion. */
    @Column(name = "used_count", nullable = false)
    private int usedCount;

    /** How many times customers applied the code at checkout (engagement). */
    @Column(name = "times_applied", nullable = false)
    private int timesApplied;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "created_by", length = 120)
    private String createdBy;

    /** Empty = valid for every package. */
    @ManyToMany
    @JoinTable(name = "promotion_packages",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "package_id"))
    private Set<TourPackage> packages = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "promotion_audiences", joinColumns = @JoinColumn(name = "promotion_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "audience", length = 30)
    private Set<Audience> audiences = EnumSet.of(Audience.ALL_CUSTOMERS);

    /** "Running" = published and today is inside the campaign dates. */
    public boolean isRunning() {
        LocalDate today = LocalDate.now();
        return status == Status.ACTIVE && !today.isBefore(startDate) && !today.isAfter(endDate);
    }

    public boolean appliesTo(TourPackage p) {
        return packages.isEmpty() || packages.stream().anyMatch(x -> x.getId().equals(p.getId()));
    }

    public boolean usageLimitReached() {
        return usageLimit != null && usedCount >= usageLimit;
    }
}
