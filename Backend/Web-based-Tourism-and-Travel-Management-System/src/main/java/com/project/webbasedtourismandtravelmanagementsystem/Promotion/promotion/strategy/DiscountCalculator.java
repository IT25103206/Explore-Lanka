package com.project.webbasedtourismandtravelmanagementsystem.promotion.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Strategy context: picks the strategy that matches the promotion's discount type. */
@Component
public class DiscountCalculator {

    private final Map<Promotion.DiscountType, DiscountStrategy> strategies = new EnumMap<>(Promotion.DiscountType.class);

    public DiscountCalculator(List<DiscountStrategy> all) {
        all.forEach(s -> strategies.put(s.type(), s));
    }

    public BigDecimal discountFor(Promotion promotion, BigDecimal subtotal) {
        DiscountStrategy strategy = strategies.get(promotion.getDiscountType());
        if (strategy == null) {
            throw new IllegalStateException("No discount strategy for " + promotion.getDiscountType());
        }
        return strategy.calculate(subtotal, promotion);
    }
}
