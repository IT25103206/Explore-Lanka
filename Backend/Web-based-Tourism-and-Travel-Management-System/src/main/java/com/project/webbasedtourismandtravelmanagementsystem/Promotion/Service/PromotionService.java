package com.project.webbasedtourismandtravelmanagementsystem.promotion.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Customer;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.CustomerRepository;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
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
import java.util.*;

/** Promotion & Offer Management (IT25102633 Mandakini N.N.K.M). */
@Service
@Transactional
public class PromotionService {

    /** Result of checking a coupon code against a booking. */
    public record AppliedPromotion(Promotion promotion, BigDecimal discount) {
    }

    private static final Set<BookingStatus> SOLD = EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

    private final PromotionRepository promotionRepository;
    private final TourPackageRepository packageRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final DiscountCalculator discountCalculator;
    private final NotificationService notificationService;

    public PromotionService(PromotionRepository promotionRepository, TourPackageRepository packageRepository,
                            BookingRepository bookingRepository, CustomerRepository customerRepository,
                            UserRepository userRepository, DiscountCalculator discountCalculator,
                            NotificationService notificationService) {
        this.promotionRepository = promotionRepository;
        this.packageRepository = packageRepository;
        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.discountCalculator = discountCalculator;
        this.notificationService = notificationService;
    }

    // ------------------------------------------------------------------ queries

    @Transactional(readOnly = true)
    public List<PromotionResponse> listAll() {
        return promotionRepository.findAllByOrderByCreatedAtDesc().stream().map(PromotionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PromotionResponse get(Long id) {
        return PromotionResponse.from(find(id));
    }

    /** Customers only ever see published, currently running offers (PBI-15). */
    @Transactional(readOnly = true)
    public List<PromotionResponse> activeOffers() {
        LocalDate today = LocalDate.now();
        return promotionRepository.findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateAsc(
                        Promotion.Status.ACTIVE, today, today).stream()
                .filter(p -> !p.usageLimitReached())
                .map(PromotionResponse::from).toList();
    }

    // ------------------------------------------------------------------ create / edit (UC-05)

    public PromotionResponse create(PromotionRequest r, String actor) {
        validate(r);
        String code = couponCode(r.couponCode(), r.title());
        if (promotionRepository.existsByCouponCodeIgnoreCase(code)) {
            throw BusinessException.conflict("Coupon code " + code + " is already used by another promotion");
        }
        if (r.endDate().isBefore(LocalDate.now())) {
            throw new BusinessException("The campaign end date is in the past");
        }
        Promotion p = new Promotion();
        apply(p, r);
        p.setCouponCode(code);
        p.setCreatedBy(actor);
        p.setStatus(r.publish() ? Promotion.Status.ACTIVE : Promotion.Status.DRAFT);
        promotionRepository.save(p);
        if (r.publish()) {
            announce(p);
        }
        return PromotionResponse.from(p);
    }

    /** UC-05 Edit Promotional Campaign. The discount of a running campaign cannot change (open issue decision). */
    public PromotionResponse update(Long id, PromotionRequest r) {
        Promotion p = find(id);
        validate(r);
        boolean discountChanged = p.getDiscountType() != r.discountType()
                || p.getDiscountValue().compareTo(r.discountValue()) != 0
                || !Objects.equals(normal(p.getMaxDiscount()), normal(r.maxDiscount()));
        if (p.isRunning() && discountChanged) {
            throw BusinessException.conflict("The discount of a running campaign cannot be changed. Deactivate it first or create a new offer.");
        }
        String code = couponCode(r.couponCode(), r.title());
        if (!p.getCouponCode().equalsIgnoreCase(code) && promotionRepository.existsByCouponCodeIgnoreCase(code)) {
            throw BusinessException.conflict("Coupon code " + code + " is already used by another promotion");
        }
        if (p.getStatus() == Promotion.Status.EXPIRED) {
            if (r.endDate().isBefore(LocalDate.now())) {
                throw new BusinessException("Extend the end date to edit an expired promotion");
            }
            p.setStatus(Promotion.Status.DRAFT);
        }
        boolean wasPublished = p.getStatus() == Promotion.Status.ACTIVE;
        apply(p, r);
        p.setCouponCode(code);
        if (r.publish() && !wasPublished) {
            p.setStatus(Promotion.Status.ACTIVE);
            announce(p);
        }
        return PromotionResponse.from(p);
    }

    public PromotionResponse publish(Long id) {
        Promotion p = find(id);
        if (p.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessException("This promotion has ended. Extend the end date before publishing.");
        }
        if (p.getStatus() != Promotion.Status.ACTIVE) {
            p.setStatus(Promotion.Status.ACTIVE);
            announce(p);
        }
        return PromotionResponse.from(p);
    }

    public PromotionResponse deactivate(Long id) {
        Promotion p = find(id);
        p.setStatus(Promotion.Status.INACTIVE);
        return PromotionResponse.from(p);
    }

    public void delete(Long id) {
        Promotion p = find(id);
        if (!bookingRepository.findByPromotionId(id).isEmpty()) {
            throw BusinessException.conflict("Bookings have used this promotion. Deactivate it instead to keep the sales history.");
        }
        promotionRepository.delete(p);
    }

    // ------------------------------------------------------------------ checkout (UC-06 extension 3a)

    /**
     * Validates a coupon for a booking and returns the discount. Throws with a clear reason
     * (expired, not for this package, audience, minimum spend, usage limit) when it cannot be used.
     * A rejected code must not roll back the caller's transaction (the quote is still shown).
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public AppliedPromotion apply(String code, TourPackage tourPackage, BigDecimal subtotal, User customer,
                                  int adults, int children, boolean countEngagement) {
        Promotion p = promotionRepository.findByCouponCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BusinessException("Promotion code " + code.trim().toUpperCase(Locale.ROOT) + " does not exist"));
        if (countEngagement) {
            p.setTimesApplied(p.getTimesApplied() + 1);
        }
        if (!p.isRunning()) {
            throw new BusinessException("Promotion code " + p.getCouponCode() + " is not active right now");
        }
        if (p.usageLimitReached()) {
            throw new BusinessException("Promotion code " + p.getCouponCode() + " has reached its usage limit");
        }
        if (!p.appliesTo(tourPackage)) {
            throw new BusinessException("Promotion code " + p.getCouponCode() + " is not valid for " + tourPackage.getName());
        }
        if (p.getMinSpend() != null && subtotal.compareTo(p.getMinSpend()) < 0) {
            throw new BusinessException("Spend at least LKR " + p.getMinSpend().setScale(0, RoundingMode.HALF_UP).toPlainString() + " to use this code");
        }
        if (!matchesAudience(p, customer, adults, children)) {
            throw new BusinessException("Promotion code " + p.getCouponCode() + " is for a different customer group");
        }
        return new AppliedPromotion(p, discountCalculator.discountFor(p, subtotal));
    }

    /** Counts a confirmed booking against the promotion (called after successful payment). */
    public void markUsed(Promotion p) {
        if (p != null) {
            p.setUsedCount(p.getUsedCount() + 1);
        }
    }

    // ------------------------------------------------------------------ performance (PBI-16)

    @Transactional(readOnly = true)
    public List<PromotionPerformance> performance() {
        List<PromotionPerformance> list = new ArrayList<>();
        for (Promotion p : promotionRepository.findAllByOrderByCreatedAtDesc()) {
            List<Booking> sold = bookingRepository.findByPromotionId(p.getId()).stream()
                    .filter(b -> SOLD.contains(b.getStatus())).toList();
            BigDecimal revenue = sold.stream().map(Booking::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal discount = sold.stream().map(Booking::getDiscountAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            double conversion = p.getTimesApplied() == 0 ? 0 : Math.round(sold.size() * 1000.0 / p.getTimesApplied()) / 10.0;
            list.add(new PromotionPerformance(p.getId(), p.getTitle(), p.getCouponCode(), p.getStatus(),
                    p.getTimesApplied(), sold.size(), revenue, discount, Math.min(conversion, 100.0)));
        }
        return list;
    }

    // ------------------------------------------------------------------ nightly job

    /** Deactivates promotions whose end date has passed. */
    public int expireFinished() {
        List<Promotion> finished = promotionRepository.findByStatusInAndEndDateBefore(
                List.of(Promotion.Status.ACTIVE, Promotion.Status.DRAFT, Promotion.Status.INACTIVE), LocalDate.now());
        finished.forEach(p -> p.setStatus(Promotion.Status.EXPIRED));
        return finished.size();
    }

    // ------------------------------------------------------------------ helpers

    /** 4a invalid discount, 7a invalid date range. */
    private void validate(PromotionRequest r) {
        if (r.endDate().isBefore(r.startDate())) {
            throw new BusinessException("Invalid date range: the end date must be on or after the start date");
        }
        if (r.discountType() == Promotion.DiscountType.PERCENTAGE) {
            if (r.discountValue().compareTo(BigDecimal.ONE) < 0 || r.discountValue().compareTo(new BigDecimal("90")) > 0) {
                throw new BusinessException("A percentage discount must be between 1% and 90%");
            }
        } else {
            if (r.discountValue().compareTo(new BigDecimal("100")) < 0 || r.discountValue().compareTo(new BigDecimal("1000000")) > 0) {
                throw new BusinessException("A fixed discount must be between LKR 100 and LKR 1,000,000");
            }
            if (r.minSpend() != null && r.minSpend().signum() > 0 && r.discountValue().compareTo(r.minSpend()) >= 0) {
                throw new BusinessException("A fixed discount must be smaller than the minimum spend");
            }
        }
    }

    private void apply(Promotion p, PromotionRequest r) {
        p.setTitle(r.title().trim());
        p.setDescription(r.description());
        p.setOfferType(r.offerType());
        p.setDiscountType(r.discountType());
        p.setDiscountValue(r.discountValue());
        p.setMaxDiscount(r.discountType() == Promotion.DiscountType.PERCENTAGE ? normal(r.maxDiscount()) : null);
        p.setMinSpend(normal(r.minSpend()));
        p.setStartDate(r.startDate());
        p.setEndDate(r.endDate());
        p.setUsageLimit(r.usageLimit());
        p.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? null : r.imageUrl().trim());
        Set<TourPackage> packages = new HashSet<>();
        if (r.packageIds() != null) {
            for (Long pid : r.packageIds()) {
                packages.add(packageRepository.findById(pid).orElseThrow(() -> new NotFoundException("Tour package", pid)));
            }
        }
        p.getPackages().clear();
        p.getPackages().addAll(packages);
        // 6a: no target criterion selected -> default to all customers
        Set<Promotion.Audience> audiences = r.audiences() == null || r.audiences().isEmpty()
                ? EnumSet.of(Promotion.Audience.ALL_CUSTOMERS) : EnumSet.copyOf(r.audiences());
        p.getAudiences().clear();
        p.getAudiences().addAll(audiences);
    }

    private boolean matchesAudience(Promotion p, User customer, int adults, int children) {
        if (p.getAudiences().contains(Promotion.Audience.ALL_CUSTOMERS)) {
            return true;
        }
        long previous = bookingRepository.countByCustomerIdAndStatusIn(customer.getId(), SOLD);
        String country = customerRepository.findByUserId(customer.getId()).map(Customer::getCountry).orElse(null);
        boolean local = country != null && country.trim().equalsIgnoreCase("Sri Lanka");
        for (Promotion.Audience a : p.getAudiences()) {
            boolean ok = switch (a) {
                case ALL_CUSTOMERS -> true;
                case NEW_CUSTOMERS -> previous == 0;
                case RETURNING_CUSTOMERS -> previous > 0;
                case LOCAL_RESIDENTS -> local;
                case INTERNATIONAL -> country != null && !local;
                case FAMILIES -> children > 0;
                case GROUPS -> adults + children >= 6;
            };
            if (ok) {
                return true;
            }
        }
        return false;
    }

    /** Ethical marketing: only customers who opted in receive promotional notifications. */
    private void announce(Promotion p) {
        for (User u : userRepository.findByRoleAndActiveTrue(Role.CUSTOMER)) {
            boolean consent = customerRepository.findByUserId(u.getId()).map(Customer::isMarketingConsent).orElse(false);
            if (consent) {
                notificationService.notify(u, Notification.Type.PROMOTION, "New offer: " + p.getTitle(),
                        "Use code " + p.getCouponCode() + " before " + p.getEndDate() + ".", "/offers.html");
            }
        }
    }

    private static String couponCode(String requested, String title) {
        if (requested != null && !requested.isBlank()) {
            return requested.trim().toUpperCase(Locale.ROOT);
        }
        String base = title.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        base = base.length() > 8 ? base.substring(0, 8) : base;
        return (base.isEmpty() ? "OFFER" : base) + (100 + new Random().nextInt(900));
    }

    private static BigDecimal normal(BigDecimal v) {
        return v == null || v.signum() == 0 ? null : v.stripTrailingZeros();
    }

    private Promotion find(Long id) {
        return promotionRepository.findById(id).orElseThrow(() -> new NotFoundException("Promotion", id));
    }
}
