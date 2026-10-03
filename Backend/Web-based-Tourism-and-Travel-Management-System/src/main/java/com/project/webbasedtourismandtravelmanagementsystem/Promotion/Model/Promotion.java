package com.project.webbasedtourismandtravelmanagementsystem.promotion.model;

import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "promotions")
public class Promotion {

    // =========================================================
    // ENUMS
    // =========================================================

    public enum OfferType {
        DISCOUNT,
        COUPON,
        PACKAGE_DEAL,
        SEASONAL,
        FLASH_SALE,
        EARLY_BIRD,
        LAST_MINUTE
    }

    public enum DiscountType {
        PERCENTAGE,
        FIXED_AMOUNT
    }

    public enum Audience {
        ALL,
        ALL_CUSTOMERS,
        NEW_CUSTOMERS,
        RETURNING_CUSTOMERS,
        LOYAL_CUSTOMERS,

        // Added because PromotionService uses these
        LOCAL_RESIDENTS,
        INTERNATIONAL,

        FAMILIES,
        COUPLES,
        SOLO_TRAVELERS,
        GROUPS
    }

    public enum Status {
        DRAFT,
        SCHEDULED,
        ACTIVE,
        PAUSED,
        INACTIVE,
        PUBLISHED,
        EXPIRED,
        ARCHIVED
    }


    // =========================================================
    // FIELDS
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long promotionId;


    @Column(nullable = false)
    private String title;


    @Column(columnDefinition = "TEXT")
    private String description;


    @Enumerated(EnumType.STRING)
    private OfferType offerType = OfferType.DISCOUNT;


    @Enumerated(EnumType.STRING)
    private DiscountType discountType =
            DiscountType.PERCENTAGE;


    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal discountValue =
            BigDecimal.ZERO;


    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal maxDiscount;


    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal minSpend =
            BigDecimal.ZERO;


    @Column(length = 30)
    private String couponCode;


    private LocalDate startDate;

    private LocalDate endDate;


    /*
     * Null means unlimited usage.
     */
    private Integer usageLimit;


    /*
     * Primitive int:
     * default value is automatically 0.
     */
    private int usedCount;


    private int timesApplied;


    @Enumerated(EnumType.STRING)
    private Status status =
            Status.DRAFT;


    @Column(length = 255)
    private String imageUrl;


    private String createdBy;


    // =========================================================
    // PACKAGES
    // =========================================================

    @ManyToMany
    @JoinTable(
            name = "promotion_packages",

            joinColumns =
            @JoinColumn(
                    name = "promotion_id"
            ),

            inverseJoinColumns =
            @JoinColumn(
                    name = "package_id"
            )
    )
    private Set<TourPackage> packages =
            new HashSet<>();


    // =========================================================
    // AUDIENCES
    // =========================================================

    @ElementCollection(
            targetClass = Audience.class
    )
    @CollectionTable(
            name = "promotion_audiences",

            joinColumns =
            @JoinColumn(
                    name = "promotion_id"
            )
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "audience")
    private Set<Audience> audiences =
            new HashSet<>();


    // =========================================================
    // CONSTRUCTORS
    // =========================================================

    public Promotion() {
    }


    public Promotion(
            String title,
            String description,
            Double discountPercentage,
            LocalDate startDate,
            LocalDate endDate,
            String status) {

        this.title = title;

        this.description = description;

        setDiscountPercentage(
                discountPercentage
        );

        this.startDate =
                startDate;

        this.endDate =
                endDate;

        setStatus(
                status
        );
    }


    // =========================================================
    // ID
    // =========================================================

    public Long getPromotionId() {
        return promotionId;
    }


    public void setPromotionId(
            Long promotionId) {

        this.promotionId =
                promotionId;
    }


    /*
     * Alias used by newer service code.
     */
    public Long getId() {
        return promotionId;
    }


    public void setId(
            Long id) {

        this.promotionId =
                id;
    }


    // =========================================================
    // TITLE
    // =========================================================

    public String getTitle() {
        return title;
    }


    public void setTitle(
            String title) {

        this.title =
                title;
    }


    // =========================================================
    // DESCRIPTION
    // =========================================================

    public String getDescription() {
        return description;
    }


    public void setDescription(
            String description) {

        this.description =
                description;
    }


    // =========================================================
    // OFFER TYPE
    // =========================================================

    public OfferType getOfferType() {

        return offerType == null
                ? OfferType.DISCOUNT
                : offerType;
    }


    public void setOfferType(
            OfferType offerType) {

        this.offerType =
                offerType == null
                        ? OfferType.DISCOUNT
                        : offerType;
    }


    // =========================================================
    // DISCOUNT TYPE
    // =========================================================

    public DiscountType getDiscountType() {

        return discountType == null
                ? DiscountType.PERCENTAGE
                : discountType;
    }


    public void setDiscountType(
            DiscountType discountType) {

        this.discountType =
                discountType == null
                        ? DiscountType.PERCENTAGE
                        : discountType;
    }


    // =========================================================
    // DISCOUNT VALUE
    // =========================================================

    public BigDecimal getDiscountValue() {

        return discountValue == null
                ? BigDecimal.ZERO
                : discountValue;
    }


    public void setDiscountValue(
            BigDecimal discountValue) {

        this.discountValue =
                discountValue == null
                        ? BigDecimal.ZERO
                        : discountValue;
    }


    // =========================================================
    // LEGACY DISCOUNT PERCENTAGE
    // =========================================================

    public Double getDiscountPercentage() {

        return getDiscountValue()
                .doubleValue();
    }


    public void setDiscountPercentage(
            Double discountPercentage) {

        this.discountType =
                DiscountType.PERCENTAGE;

        this.discountValue =
                discountPercentage == null
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(
                        discountPercentage
                );
    }


    // =========================================================
    // MAX DISCOUNT
    // =========================================================

    public BigDecimal getMaxDiscount() {
        return maxDiscount;
    }


    public void setMaxDiscount(
            BigDecimal maxDiscount) {

        this.maxDiscount =
                maxDiscount;
    }


    // =========================================================
    // MINIMUM SPEND
    // =========================================================

    public BigDecimal getMinSpend() {

        return minSpend == null
                ? BigDecimal.ZERO
                : minSpend;
    }


    public void setMinSpend(
            BigDecimal minSpend) {

        this.minSpend =
                minSpend == null
                        ? BigDecimal.ZERO
                        : minSpend;
    }


    // =========================================================
    // COUPON CODE
    // =========================================================

    public String getCouponCode() {
        return couponCode;
    }


    public void setCouponCode(
            String couponCode) {

        this.couponCode =
                couponCode == null
                        || couponCode.isBlank()

                        ? null

                        : couponCode
                        .trim()
                        .toUpperCase();
    }


    // =========================================================
    // START DATE
    // =========================================================

    public LocalDate getStartDate() {
        return startDate;
    }


    public void setStartDate(
            LocalDate startDate) {

        this.startDate =
                startDate;
    }


    // =========================================================
    // END DATE
    // =========================================================

    public LocalDate getEndDate() {
        return endDate;
    }


    public void setEndDate(
            LocalDate endDate) {

        this.endDate =
                endDate;
    }


    // =========================================================
    // USAGE LIMIT
    // =========================================================

    public Integer getUsageLimit() {
        return usageLimit;
    }


    public void setUsageLimit(
            Integer usageLimit) {

        /*
         * null or <= 0 means unlimited.
         */
        this.usageLimit =
                usageLimit == null
                        || usageLimit <= 0

                        ? null

                        : usageLimit;
    }


    // =========================================================
    // USED COUNT
    // =========================================================

    public int getUsedCount() {
        return usedCount;
    }


    public void setUsedCount(
            int usedCount) {

        this.usedCount =
                Math.max(
                        0,
                        usedCount
                );
    }


    public void incrementUsedCount() {

        usedCount++;
    }


    // =========================================================
    // TIMES APPLIED
    // =========================================================

    public int getTimesApplied() {
        return timesApplied;
    }


    public void setTimesApplied(
            int timesApplied) {

        this.timesApplied =
                Math.max(
                        0,
                        timesApplied
                );
    }


    public void incrementTimesApplied() {

        timesApplied++;
    }


    // =========================================================
    // STATUS
    // =========================================================

    public Status getStatus() {

        return status == null
                ? Status.DRAFT
                : status;
    }


    public void setStatus(
            Status status) {

        this.status =
                status == null
                        ? Status.DRAFT
                        : status;
    }


    /*
     * Supports old code that supplies
     * status as String.
     */
    public void setStatus(
            String status) {

        if (status == null
                || status.isBlank()) {

            this.status =
                    Status.DRAFT;

            return;
        }


        this.status =
                Status.valueOf(
                        status
                                .trim()
                                .toUpperCase()
                );
    }


    // =========================================================
    // CHECK WHETHER PROMOTION IS CURRENTLY RUNNING
    // =========================================================

    public boolean isRunning() {

        LocalDate today =
                LocalDate.now();


        boolean withinDates =

                (startDate == null
                        || !today.isBefore(
                        startDate
                ))

                        &&

                        (endDate == null
                                || !today.isAfter(
                                endDate
                        ));


        return getStatus()
                == Status.ACTIVE

                && withinDates

                && !usageLimitReached();
    }


    // =========================================================
    // CHECK USAGE LIMIT
    // =========================================================

    /**
     * Returns true when this promotion has reached its
     * configured usage limit.
     *
     * A null usageLimit means unlimited usage.
     */
    public boolean usageLimitReached() {

        if (usageLimit == null
                || usageLimit <= 0) {

            return false;
        }


        return usedCount >=
                usageLimit;
    }


    // =========================================================
    // CHECK PACKAGE APPLICABILITY
    // =========================================================

    /**
     * Checks whether this promotion can be used for
     * the given tour package.
     *
     * If no packages have been selected, the promotion
     * applies to all packages.
     */
    public boolean appliesTo(
            TourPackage tourPackage) {

        if (tourPackage == null) {

            return false;
        }


        Set<TourPackage> applicablePackages =
                getPackages();


        if (applicablePackages.isEmpty()) {

            return true;
        }


        /*
         * First try normal entity equality.
         */
        if (applicablePackages.contains(
                tourPackage
        )) {

            return true;
        }


        /*
         * Also compare IDs.
         *
         * TourPackage in the newer code uses getId().
         */
        if (tourPackage.getId()
                == null) {

            return false;
        }


        return applicablePackages
                .stream()

                .anyMatch(p ->

                        p != null

                                && p.getId()
                                != null

                                && p.getId()
                                .equals(
                                        tourPackage
                                                .getId()
                                )
                );
    }


    // =========================================================
    // IMAGE
    // =========================================================

    public String getImageUrl() {
        return imageUrl;
    }


    public void setImageUrl(
            String imageUrl) {

        this.imageUrl =
                imageUrl;
    }


    // =========================================================
    // PACKAGES
    // =========================================================

    public Set<TourPackage> getPackages() {

        if (packages == null) {

            packages =
                    new HashSet<>();
        }

        return packages;
    }


    public void setPackages(
            Set<TourPackage> packages) {

        this.packages =
                packages == null
                        ? new HashSet<>()
                        : packages;
    }


    // =========================================================
    // AUDIENCES
    // =========================================================

    public Set<Audience> getAudiences() {

        if (audiences == null) {

            audiences =
                    new HashSet<>();
        }

        return audiences;
    }


    public void setAudiences(
            Set<Audience> audiences) {

        this.audiences =
                audiences == null
                        ? new HashSet<>()
                        : audiences;
    }


    // =========================================================
    // CREATED BY
    // =========================================================

    public String getCreatedBy() {
        return createdBy;
    }


    public void setCreatedBy(
            String createdBy) {

        this.createdBy =
                createdBy;
    }
}