package com.project.webbasedtourismandtravelmanagementsystem.promotion.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** e.g. 15% off, optionally capped at a maximum amount. */
@Component
public class PercentageDiscountStrategy implements DiscountStrategy {

    @Override
    public Promotion.DiscountType type() {
        return Promotion.DiscountType.PERCENTAGE;
    }

    @Override
    public BigDecimal calculate(BigDecimal subtotal, Promotion promotion) {
        BigDecimal discount = subtotal.multiply(promotion.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        if (promotion.getMaxDiscount() != null && discount.compareTo(promotion.getMaxDiscount()) > 0) {
            discount = promotion.getMaxDiscount();
        }
        return discount.min(subtotal).max(BigDecimal.ZERO);
    }
}
