package com.project.webbasedtourismandtravelmanagementsystem.promotion.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;

import java.math.BigDecimal;

/**
 * STRATEGY PATTERN - one way of turning a promotion into a discount amount.
 * New discount kinds (e.g. "buy 3 nights get 1 free") are added as new strategies
 * without touching the booking code.
 */
public interface DiscountStrategy {

    Promotion.DiscountType type();

    /** Discount for the given subtotal; never negative and never more than the subtotal. */
    BigDecimal calculate(BigDecimal subtotal, Promotion promotion);
}
