package com.project.webbasedtourismandtravelmanagementsystem.payment.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResult;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;

import java.math.BigDecimal;

/**
 * STRATEGY PATTERN - each payment method validates and processes a payment its own way.
 * PaymentService chooses the strategy by {@link Payment.Method} and never needs if/else chains.
 * The gateway is simulated (project constraint); a real provider would replace process().
 */
public interface PaymentStrategy {

    Payment.Method method();

    /** Validates the method-specific fields; throws BusinessException for invalid input. */
    void validate(PaymentRequest request);

    PaymentResult process(PaymentRequest request, BigDecimal amount);
}
