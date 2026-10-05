package com.project.webbasedtourismandtravelmanagementsystem.promotion.dto;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

public final class PromotionDtos {

    private PromotionDtos() {
    }

    public record PromotionRequest(
            @NotBlank(message = "Title is required") @Size(min = 3, max = 120) String title,
            @Size(max = 1000) String description,
            @NotNull(message = "Choose an offer type") Promotion.OfferType offerType,
            @NotNull(message = "Choose a discount type") Promotion.DiscountType discountType,
            @NotNull(message = "Discount value is required")
            @DecimalMin(value = "0.01", message = "Discount must be greater than zero") BigDecimal discountValue,
            @DecimalMin(value = "0.00", message = "Maximum discount cannot be negative") BigDecimal maxDiscount,
            @DecimalMin(value = "0.00", message = "Minimum spend cannot be negative") BigDecimal minSpend,
            @Pattern(regexp = "^([A-Za-z0-9-]{3,30})?$",
                    message = "Coupon code: 3-30 letters, digits or hyphens") String couponCode,
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @Min(value = 1, message = "Usage limit must be at least 1") Integer usageLimit,
            @Size(max = 255) String imageUrl,
            Set<Long> packageIds,
            Set<Promotion.Audience> audiences,
            boolean publish) {
    }

    public record PromotionResponse(
            Long id,
            String title,
            String description,
            Promotion.OfferType offerType,
            Promotion.DiscountType discountType,
            BigDecimal discountValue,
            BigDecimal maxDiscount,
            BigDecimal minSpend,
            String couponCode,
            LocalDate startDate,
            LocalDate endDate,
            Integer usageLimit,
            int usedCount,
            int timesApplied,
            Promotion.Status status,
            boolean running,
            String imageUrl,
            List<Long> packageIds,
            List<String> packageNames,
            List<Promotion.Audience> audiences,
            String createdBy) {

        public static PromotionResponse from(Promotion promotion) {
            List<TourPackage> packages = promotion.getPackages().stream()
                    .sorted(Comparator.comparing(TourPackage::getName))
                    .toList();

            return new PromotionResponse(
                    promotion.getId(),
                    promotion.getTitle(),
                    promotion.getDescription(),
                    promotion.getOfferType(),
                    promotion.getDiscountType(),
                    promotion.getDiscountValue(),
                    promotion.getMaxDiscount(),
                    promotion.getMinSpend(),
                    promotion.getCouponCode(),
                    promotion.getStartDate(),
                    promotion.getEndDate(),
                    promotion.getUsageLimit(),
                    promotion.getUsedCount(),
                    promotion.getTimesApplied(),
                    promotion.getStatus(),
                    promotion.isRunning(),
                    promotion.getImageUrl(),
                    packages.stream().map(TourPackage::getId).toList(),
                    packages.stream().map(TourPackage::getName).toList(),
                    promotion.getAudiences().stream().sorted().toList(),
                    promotion.getCreatedBy());
        }
    }

    public record PromotionPerformance(
            Long id,
            String title,
            String couponCode,
            Promotion.Status status,
            int timesApplied,
            long bookings,
            BigDecimal revenue,
            BigDecimal discountGiven,
            double conversionRate) {
    }

    public record CodeCheckResponse(
            boolean valid,
            String message,
            String couponCode,
            String title,
            BigDecimal discount) {
    }
}

