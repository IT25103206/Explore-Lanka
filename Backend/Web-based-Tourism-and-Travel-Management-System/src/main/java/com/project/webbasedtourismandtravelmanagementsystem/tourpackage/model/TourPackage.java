package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * A tour product in the catalogue. Subclasses (Standard / Seasonal / Custom) are created by
 * {@link com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageFactory}
 * and stored in one table (single-table inheritance) with a "package_type" discriminator.
 */
@Entity
@Table(name = "tour_packages")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "package_type", length = 20)
@Getter
@Setter
public abstract class TourPackage extends BaseEntity {

    /** Children (under 12) pay half the adult package price. */
    public static final BigDecimal CHILD_RATE = new BigDecimal("0.50");

    public enum Category { CULTURAL, WILDLIFE, BEACH, HILL_COUNTRY, ADVENTURE, RELIGIOUS, HONEYMOON, FAMILY }

    public enum Status { ACTIVE, INACTIVE }

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    /** Province used to match festivals and events, e.g. "Central". */
    @Column(nullable = false, length = 40)
    private String region;

    /** Towns visited, comma separated, e.g. "Kandy, Nuwara Eliya, Ella". Hotels are matched on these. */
    @Column(nullable = false, length = 255)
    private String destinations;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    /** Package price per adult (excluding hotel, vehicle and guide which the tourist selects). */
    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "max_group_size", nullable = false)
    private int maxGroupSize;

    @Column(name = "guide_recommended", nullable = false)
    private boolean guideRecommended = true;

    @Column(length = 2000)
    private String description;

    @Column(length = 1000)
    private String highlights;

    @Column(length = 1000)
    private String inclusions;

    @Column(length = 1000)
    private String exclusions;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    /** Schedule window in which the tour can start. */
    @Column(name = "available_from", nullable = false)
    private LocalDate availableFrom;

    @Column(name = "available_to", nullable = false)
    private LocalDate availableTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @OneToMany(mappedBy = "tourPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC")
    private List<PackageItineraryDay> itineraryDays = new ArrayList<>();

    // ---------------------------------------------------------------- polymorphic behaviour

    public abstract PackageType getPackageType();

    /** Adult price for a tour starting on the given date. */
    public abstract BigDecimal pricePerAdult(LocalDate travelDate);

    /** Extra cost when a tourist lengthens the tour (only custom packages allow it). */
    public BigDecimal extraDaysCost(int extraDays, int travellers) {
        return BigDecimal.ZERO;
    }

    public int maxExtraDays() {
        return 0;
    }

    /** CalculateFinalPrice() from the sequence diagram: package part of a booking. */
    public BigDecimal packageCost(LocalDate travelDate, int adults, int children, int extraDays) {
        BigDecimal adult = pricePerAdult(travelDate);
        BigDecimal total = adult.multiply(BigDecimal.valueOf(adults))
                .add(adult.multiply(CHILD_RATE).multiply(BigDecimal.valueOf(children)))
                .add(extraDaysCost(extraDays, adults + children));
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    public List<String> destinationList() {
        return Arrays.stream(destinations.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public boolean isBookable() {
        return status == Status.ACTIVE && !availableTo.isBefore(LocalDate.now());
    }

    public void replaceItinerary(List<PackageItineraryDay> days) {
        itineraryDays.clear();
        for (PackageItineraryDay d : days) {
            d.setTourPackage(this);
            itineraryDays.add(d);
        }
    }
}
