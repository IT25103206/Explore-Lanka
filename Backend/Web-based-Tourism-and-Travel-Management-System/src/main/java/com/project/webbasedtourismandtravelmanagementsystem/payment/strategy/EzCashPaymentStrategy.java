package com.project.webbasedtourismandtravelmanagementsystem.payment.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResult;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** eZ Cash mobile wallet (simulated). PIN 0000 simulates a wrong PIN. */
@Component
public class EzCashPaymentStrategy implements PaymentStrategy {

    private static final BigDecimal WALLET_LIMIT = new BigDecimal("1000000");

    @Override
    public Payment.Method method() {
        return Payment.Method.EZ_CASH;
    }

    @Override
    public void validate(PaymentRequest r) {
        if (r.mobileNumber() == null || !r.mobileNumber().trim().matches("^07[0-9]{8}$")) {
            throw new BusinessException("Enter your eZ Cash mobile number, e.g. 0771234567");
        }
        if (r.pin() == null || !r.pin().matches("^\\d{4}$")) {
            throw new BusinessException("Enter your 4-digit eZ Cash PIN");
        }
    }

    @Override
    public PaymentResult process(PaymentRequest r, BigDecimal amount) {
        String m = r.mobileNumber().trim();
        String masked = "eZ Cash " + m.substring(0, 3) + "***" + m.substring(6);
        if (amount.compareTo(WALLET_LIMIT) > 0) {
            return PaymentResult.failed(masked, "eZ Cash payments are limited to LKR 1,000,000 - please use a card or bank transfer");
        }
        if ("0000".equals(r.pin())) {
            return PaymentResult.failed(masked, "Incorrect eZ Cash PIN");
        }
        return PaymentResult.success(masked);
    }
}
