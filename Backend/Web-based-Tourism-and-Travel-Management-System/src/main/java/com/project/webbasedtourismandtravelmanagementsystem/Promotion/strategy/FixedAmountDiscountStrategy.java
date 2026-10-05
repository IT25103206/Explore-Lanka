package com.project.webbasedtourismandtravelmanagementsystem.promotion.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** e.g. LKR 10,000 off. */
@Component
public class FixedAmountDiscountStrategy implements DiscountStrategy {

    @Override
    public Promotion.DiscountType type() {
        return Promotion.DiscountType.FIXED_AMOUNT;
    }

    @Override
    public BigDecimal calculate(BigDecimal subtotal, Promotion promotion) {
        return promotion.getDiscountValue().min(subtotal).max(BigDecimal.ZERO);
    }
}
