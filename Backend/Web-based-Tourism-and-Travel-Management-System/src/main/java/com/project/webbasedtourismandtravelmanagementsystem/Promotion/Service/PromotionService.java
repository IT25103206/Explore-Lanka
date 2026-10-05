package com.project.webbasedtourismandtravelmanagementsystem.promotion.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Customer;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.CustomerRepository;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;

import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;

import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.dto.PromotionDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.repository.PromotionRepository;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.strategy.DiscountCalculator;

import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Random;
import java.util.Set;

@Service
@Transactional
public class PromotionService {

    // =========================================================
    // APPLIED PROMOTION
    // =========================================================

    public record AppliedPromotion(
            Promotion promotion,
            BigDecimal discount
    ) {
    }


    // =========================================================
    // DEPENDENCIES
    // =========================================================

    private final PromotionRepository promotionRepository;
    private final TourPackageRepository packageRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final DiscountCalculator discountCalculator;
    private final NotificationService notificationService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public PromotionService(
            PromotionRepository promotionRepository,
            TourPackageRepository packageRepository,
            BookingRepository bookingRepository,
            CustomerRepository customerRepository,
            UserRepository userRepository,
            DiscountCalculator discountCalculator,
            NotificationService notificationService) {

        this.promotionRepository = promotionRepository;
        this.packageRepository = packageRepository;
        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.discountCalculator = discountCalculator;
        this.notificationService = notificationService;
    }


    // =========================================================
    // GET ALL PROMOTIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PromotionResponse> listAll() {

        return promotionRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(PromotionResponse::from)
                .toList();
    }


    // =========================================================
    // GET PROMOTION
    // =========================================================

    @Transactional(readOnly = true)
    public PromotionResponse get(Long id) {

        return PromotionResponse.from(
                find(id)
        );
    }


    // =========================================================
    // ACTIVE OFFERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PromotionResponse> activeOffers() {

        LocalDate today = LocalDate.now();

        return promotionRepository
                .findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateAsc(
                        Promotion.Status.ACTIVE,
                        today,
                        today
                )
                .stream()
                .filter(promotion ->
                        !promotion.usageLimitReached()
                )
                .map(PromotionResponse::from)
                .toList();
    }


    // =========================================================
    // CREATE PROMOTION
    // =========================================================

    public PromotionResponse create(
            PromotionRequest request,
            String actor) {

        validate(request);

        String code = couponCode(
                request.couponCode(),
                request.title()
        );

        if (promotionRepository.existsByCouponCodeIgnoreCase(code)) {

            throw BusinessException.conflict(
                    "Coupon code "
                            + code
                            + " is already used by another promotion"
            );
        }

        if (request.endDate().isBefore(LocalDate.now())) {

            throw new BusinessException(
                    "The campaign end date is in the past"
            );
        }

        Promotion promotion = new Promotion();

        apply(
                promotion,
                request
        );

        promotion.setCouponCode(code);

        promotion.setCreatedBy(actor);

        promotion.setStatus(
                request.publish()
                        ? Promotion.Status.ACTIVE
                        : Promotion.Status.DRAFT
        );

        promotionRepository.save(promotion);

        if (request.publish()) {
            announce(promotion);
        }

        return PromotionResponse.from(promotion);
    }


    // =========================================================
    // UPDATE PROMOTION
    // =========================================================

    public PromotionResponse update(
            Long id,
            PromotionRequest request) {

        Promotion promotion = find(id);

        validate(request);

        boolean discountChanged =
                promotion.getDiscountType() != request.discountType()

                        ||

                        promotion
                                .getDiscountValue()
                                .compareTo(
                                        request.discountValue()
                                ) != 0

                        ||

                        !Objects.equals(
                                normal(promotion.getMaxDiscount()),
                                normal(request.maxDiscount())
                        );

        if (promotion.isRunning()
                && discountChanged) {

            throw BusinessException.conflict(
                    "The discount of a running campaign cannot be changed. "
                            + "Deactivate it first or create a new offer."
            );
        }

        String code = couponCode(
                request.couponCode(),
                request.title()
        );

        if (promotion.getCouponCode() != null
                && !promotion
                .getCouponCode()
                .equalsIgnoreCase(code)

                && promotionRepository
                .existsByCouponCodeIgnoreCase(code)) {

            throw BusinessException.conflict(
                    "Coupon code "
                            + code
                            + " is already used by another promotion"
            );
        }

        if (promotion.getStatus()
                == Promotion.Status.EXPIRED) {

            if (request.endDate()
                    .isBefore(LocalDate.now())) {

                throw new BusinessException(
                        "Extend the end date to edit an expired promotion"
                );
            }

            promotion.setStatus(
                    Promotion.Status.DRAFT
            );
        }

        boolean wasPublished =
                promotion.getStatus()
                        == Promotion.Status.ACTIVE;

        apply(
                promotion,
                request
        );

        promotion.setCouponCode(code);

        if (request.publish()
                && !wasPublished) {

            promotion.setStatus(
                    Promotion.Status.ACTIVE
            );

            announce(promotion);
        }

        return PromotionResponse.from(promotion);
    }


    // =========================================================
    // PUBLISH PROMOTION
    // =========================================================

    public PromotionResponse publish(Long id) {

        Promotion promotion = find(id);

        if (promotion.getEndDate() != null
                && promotion
                .getEndDate()
                .isBefore(LocalDate.now())) {

            throw new BusinessException(
                    "This promotion has ended. "
                            + "Extend the end date before publishing."
            );
        }

        if (promotion.getStatus()
                != Promotion.Status.ACTIVE) {

            promotion.setStatus(
                    Promotion.Status.ACTIVE
            );

            announce(promotion);
        }

        return PromotionResponse.from(promotion);
    }


    // =========================================================
    // DEACTIVATE PROMOTION
    // =========================================================

    public PromotionResponse deactivate(Long id) {

        Promotion promotion = find(id);

        promotion.setStatus(
                Promotion.Status.INACTIVE
        );

        return PromotionResponse.from(promotion);
    }


    // =========================================================
    // DELETE PROMOTION
    // =========================================================

    public void delete(Long id) {

        Promotion promotion = find(id);

        List<Booking> bookings =
                bookingRepository
                        .findByPromotion_PromotionId(id);

        if (!bookings.isEmpty()) {

            throw BusinessException.conflict(
                    "Bookings have used this promotion. "
                            + "Deactivate it instead to keep the sales history."
            );
        }

        promotionRepository.delete(promotion);
    }


    // =========================================================
    // APPLY COUPON
    // =========================================================

    @Transactional(
            noRollbackFor = BusinessException.class
    )
    public AppliedPromotion apply(
            String code,
            TourPackage tourPackage,
            BigDecimal subtotal,
            User customer,
            int adults,
            int children,
            boolean countEngagement) {

        if (code == null
                || code.trim().isEmpty()) {

            throw new BusinessException(
                    "Promotion code is required"
            );
        }

        Promotion promotion =
                promotionRepository
                        .findByCouponCodeIgnoreCase(
                                code.trim()
                        )
                        .orElseThrow(() ->
                                new BusinessException(
                                        "Promotion code "
                                                + code
                                                .trim()
                                                .toUpperCase(
                                                        Locale.ROOT
                                                )
                                                + " does not exist"
                                )
                        );

        if (countEngagement) {

            promotion.incrementTimesApplied();
        }

        if (!promotion.isRunning()) {

            throw new BusinessException(
                    "Promotion code "
                            + promotion.getCouponCode()
                            + " is not active right now"
            );
        }

        if (promotion.usageLimitReached()) {

            throw new BusinessException(
                    "Promotion code "
                            + promotion.getCouponCode()
                            + " has reached its usage limit"
            );
        }

        if (!promotion.appliesTo(tourPackage)) {

            throw new BusinessException(
                    "Promotion code "
                            + promotion.getCouponCode()
                            + " is not valid for "
                            + tourPackage.getName()
            );
        }

        if (promotion.getMinSpend() != null
                && subtotal != null
                && subtotal.compareTo(
                promotion.getMinSpend()
        ) < 0) {

            throw new BusinessException(
                    "Spend at least LKR "
                            + promotion
                            .getMinSpend()
                            .setScale(
                                    0,
                                    RoundingMode.HALF_UP
                            )
                            .toPlainString()
                            + " to use this code"
            );
        }

        if (!matchesAudience(
                promotion,
                customer,
                adults,
                children)) {

            throw new BusinessException(
                    "Promotion code "
                            + promotion.getCouponCode()
                            + " is for a different customer group"
            );
        }

        return new AppliedPromotion(
                promotion,
                discountCalculator.discountFor(
                        promotion,
                        subtotal
                )
        );
    }


    // =========================================================
    // MARK PROMOTION AS USED
    // =========================================================

    public void markUsed(Promotion promotion) {

        if (promotion != null) {

            /*
             * usedCount is primitive int.
             * Therefore it must NOT be compared with null.
             */
            promotion.incrementUsedCount();
        }
    }


    // =========================================================
    // PERFORMANCE
    // =========================================================

    @Transactional(readOnly = true)
    public List<PromotionPerformance> performance() {

        List<PromotionPerformance> result =
                new ArrayList<>();

        for (Promotion promotion :
                promotionRepository
                        .findAllByOrderByCreatedAtDesc()) {

            List<Booking> bookings =
                    bookingRepository
                            .findByPromotion_PromotionId(
                                    promotion.getPromotionId()
                            );

            List<Booking> sold =
                    bookings.stream()
                            .filter(booking -> {

                                String status =
                                        booking.getStatus();

                                return status != null
                                        && (
                                        status.equalsIgnoreCase(
                                                "CONFIRMED"
                                        )
                                                ||
                                                status.equalsIgnoreCase(
                                                        "COMPLETED"
                                                )
                                );
                            })
                            .toList();

            double revenueValue =
                    sold.stream()
                            .mapToDouble(
                                    Booking::getTotalAmount
                            )
                            .sum();

            BigDecimal revenue =
                    BigDecimal.valueOf(
                            revenueValue
                    );

            /*
             * Your current Booking model does not
             * appear to have discountAmount.
             */
            BigDecimal discount =
                    BigDecimal.ZERO;

            int timesApplied =
                    promotion.getTimesApplied();

            double conversion =
                    timesApplied == 0
                            ? 0
                            : Math.round(
                            sold.size()
                                    * 1000.0
                                    / timesApplied
                    ) / 10.0;

            result.add(
                    new PromotionPerformance(
                            promotion.getPromotionId(),
                            promotion.getTitle(),
                            promotion.getCouponCode(),
                            promotion.getStatus(),
                            promotion.getTimesApplied(),
                            sold.size(),
                            revenue,
                            discount,
                            Math.min(
                                    conversion,
                                    100.0
                            )
                    )
            );
        }

        return result;
    }


    // =========================================================
    // EXPIRE FINISHED PROMOTIONS
    // =========================================================

    public int expireFinished() {

        List<Promotion> finished =
                promotionRepository
                        .findByStatusInAndEndDateBefore(
                                List.of(
                                        Promotion.Status.ACTIVE,
                                        Promotion.Status.DRAFT,
                                        Promotion.Status.INACTIVE
                                ),
                                LocalDate.now()
                        );

        finished.forEach(
                promotion ->
                        promotion.setStatus(
                                Promotion.Status.EXPIRED
                        )
        );

        return finished.size();
    }


    // =========================================================
    // VALIDATE REQUEST
    // =========================================================

    private void validate(
            PromotionRequest request) {

        if (request == null) {

            throw new BusinessException(
                    "Promotion information is required"
            );
        }

        if (request.startDate() == null
                || request.endDate() == null) {

            throw new BusinessException(
                    "Start date and end date are required"
            );
        }

        if (request.endDate()
                .isBefore(
                        request.startDate()
                )) {

            throw new BusinessException(
                    "Invalid date range: "
                            + "the end date must be on or after the start date"
            );
        }

        if (request.discountValue() == null) {

            throw new BusinessException(
                    "Discount value is required"
            );
        }

        if (request.discountType()
                == Promotion.DiscountType.PERCENTAGE) {

            if (request
                    .discountValue()
                    .compareTo(
                            BigDecimal.ONE
                    ) < 0

                    ||

                    request
                            .discountValue()
                            .compareTo(
                                    new BigDecimal("90")
                            ) > 0) {

                throw new BusinessException(
                        "A percentage discount must be between 1% and 90%"
                );
            }

        } else {

            if (request
                    .discountValue()
                    .compareTo(
                            new BigDecimal("100")
                    ) < 0

                    ||

                    request
                            .discountValue()
                            .compareTo(
                                    new BigDecimal(
                                            "1000000"
                                    )
                            ) > 0) {

                throw new BusinessException(
                        "A fixed discount must be between "
                                + "LKR 100 and LKR 1,000,000"
                );
            }

            if (request.minSpend() != null
                    && request.minSpend().signum() > 0
                    && request
                    .discountValue()
                    .compareTo(
                            request.minSpend()
                    ) >= 0) {

                throw new BusinessException(
                        "A fixed discount must be smaller "
                                + "than the minimum spend"
                );
            }
        }
    }


    // =========================================================
    // APPLY REQUEST DATA TO ENTITY
    // =========================================================

    private void apply(
            Promotion promotion,
            PromotionRequest request) {

        promotion.setTitle(
                request.title().trim()
        );

        promotion.setDescription(
                request.description()
        );

        promotion.setOfferType(
                request.offerType()
        );

        promotion.setDiscountType(
                request.discountType()
        );

        promotion.setDiscountValue(
                request.discountValue()
        );

        promotion.setMaxDiscount(
                request.discountType()
                        == Promotion.DiscountType.PERCENTAGE
                        ? normal(
                        request.maxDiscount()
                )
                        : null
        );

        promotion.setMinSpend(
                normal(
                        request.minSpend()
                )
        );

        promotion.setStartDate(
                request.startDate()
        );

        promotion.setEndDate(
                request.endDate()
        );

        promotion.setUsageLimit(
                request.usageLimit()
        );

        promotion.setImageUrl(
                request.imageUrl() == null
                        || request.imageUrl().isBlank()
                        ? null
                        : request
                        .imageUrl()
                        .trim()
        );

        // -----------------------------------------------------
        // PACKAGES
        // -----------------------------------------------------

        Set<TourPackage> packages =
                new HashSet<>();

        if (request.packageIds() != null) {

            for (Long packageId :
                    request.packageIds()) {

                TourPackage tourPackage =
                        packageRepository
                                .findById(packageId)
                                .orElseThrow(() ->
                                        new NotFoundException(
                                                "Tour package",
                                                packageId
                                        )
                                );

                packages.add(
                        tourPackage
                );
            }
        }

        promotion
                .getPackages()
                .clear();

        promotion
                .getPackages()
                .addAll(
                        packages
                );

        // -----------------------------------------------------
        // AUDIENCES
        // -----------------------------------------------------

        Set<Promotion.Audience> audiences;

        if (request.audiences() == null
                || request
                .audiences()
                .isEmpty()) {

            audiences =
                    EnumSet.of(
                            Promotion.Audience
                                    .ALL_CUSTOMERS
                    );

        } else {

            audiences =
                    EnumSet.copyOf(
                            request.audiences()
                    );
        }

        promotion
                .getAudiences()
                .clear();

        promotion
                .getAudiences()
                .addAll(
                        audiences
                );
    }


    // =========================================================
    // AUDIENCE MATCHING
    // =========================================================

    private boolean matchesAudience(
            Promotion promotion,
            User customer,
            int adults,
            int children) {

        Set<Promotion.Audience> audiences =
                promotion.getAudiences();

        /*
         * ALL and ALL_CUSTOMERS both mean
         * everyone can use the promotion.
         */
        if (audiences.isEmpty()
                || audiences.contains(
                Promotion.Audience.ALL
        )
                || audiences.contains(
                Promotion.Audience.ALL_CUSTOMERS
        )) {

            return true;
        }

        if (customer == null
                || customer.getUserId() == null) {

            return false;
        }

        Long userId =
                customer.getUserId();

        long previousBookings =
                bookingRepository
                        .findByCustomer_UserIdOrderByBookingIdDesc(
                                userId
                        )
                        .stream()
                        .filter(booking -> {

                            String status =
                                    booking.getStatus();

                            return status != null
                                    && (
                                    status.equalsIgnoreCase(
                                            "CONFIRMED"
                                    )
                                            ||
                                            status.equalsIgnoreCase(
                                                    "COMPLETED"
                                            )
                            );
                        })
                        .count();

        String country =
                customerRepository
                        .findByUserId(
                                userId
                        )
                        .map(
                                Customer::getCountry
                        )
                        .orElse(null);

        boolean local =
                country != null
                        && country
                        .trim()
                        .equalsIgnoreCase(
                                "Sri Lanka"
                        );

        for (Promotion.Audience audience :
                audiences) {

            boolean match =
                    switch (audience) {

                        case ALL,
                             ALL_CUSTOMERS ->
                                true;

                        case NEW_CUSTOMERS ->
                                previousBookings == 0;

                        case RETURNING_CUSTOMERS ->
                                previousBookings > 0;

                        /*
                         * There is currently no separate
                         * loyalty-point field available here,
                         * so use repeat booking history.
                         */
                        case LOYAL_CUSTOMERS ->
                                previousBookings >= 3;

                        case LOCAL_RESIDENTS ->
                                local;

                        case INTERNATIONAL ->
                                country != null
                                        && !local;

                        case FAMILIES ->
                                children > 0;

                        case COUPLES ->
                                adults == 2
                                        && children == 0;

                        case SOLO_TRAVELERS ->
                                adults == 1
                                        && children == 0;

                        case GROUPS ->
                                adults + children >= 6;
                    };

            if (match) {
                return true;
            }
        }

        return false;
    }


    // =========================================================
    // PROMOTION NOTIFICATION
    // =========================================================

    private void announce(
            Promotion promotion) {

        List<User> customers =
                userRepository
                        .findByRoleAndActiveTrue(
                                Role.CUSTOMER
                        );

        for (User user : customers) {

            boolean consent =
                    customerRepository
                            .findByUserId(
                                    user.getUserId()
                            )
                            .map(
                                    Customer::isMarketingConsent
                            )
                            .orElse(false);

            if (consent) {

                notificationService.notify(
                        user,
                        Notification.Type.PROMOTION,
                        "New offer: "
                                + promotion.getTitle(),
                        "Use code "
                                + promotion.getCouponCode()
                                + " before "
                                + promotion.getEndDate()
                                + ".",
                        "/offers.html"
                );
            }
        }
    }


    // =========================================================
    // GENERATE COUPON CODE
    // =========================================================

    private static String couponCode(
            String requested,
            String title) {

        if (requested != null
                && !requested.isBlank()) {

            return requested
                    .trim()
                    .toUpperCase(
                            Locale.ROOT
                    );
        }

        String base =
                title == null
                        ? ""
                        : title
                        .toUpperCase(
                                Locale.ROOT
                        )
                        .replaceAll(
                                "[^A-Z0-9]",
                                ""
                        );

        base =
                base.length() > 8
                        ? base.substring(
                        0,
                        8
                )
                        : base;

        return (
                base.isEmpty()
                        ? "OFFER"
                        : base
        )
                +
                (
                        100
                                +
                                new Random()
                                        .nextInt(
                                                900
                                        )
                );
    }


    // =========================================================
    // NORMALIZE BigDecimal
    // =========================================================

    private static BigDecimal normal(
            BigDecimal value) {

        return value == null
                || value.signum() == 0
                ? null
                : value.stripTrailingZeros();
    }


    // =========================================================
    // FIND PROMOTION
    // =========================================================

    private Promotion find(Long id) {

        return promotionRepository
                .findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Promotion",
                                id
                        )
                );
    }
}