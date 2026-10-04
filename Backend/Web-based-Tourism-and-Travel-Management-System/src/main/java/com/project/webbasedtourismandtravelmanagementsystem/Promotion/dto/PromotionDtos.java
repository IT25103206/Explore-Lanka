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
            @DecimalMin(value = "0.00", message = "Maximum discount cannot be negative") BigDecimal maxDiscount,
            @DecimalMin(value = "0.00", message = "Minimum spend cannot be negative") BigDecimal minSpend,
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @Min(value = 1, message = "Usage limit must be at least 1") Integer usageLimit,
            @Size(max = 255) String imageUrl,
            Set<Long> packageIds,
            Set<Promotion.Audience> audiences,
            boolean publish) {
    }

        }
    }

                                       double conversionRate) {
    }

    }
}
