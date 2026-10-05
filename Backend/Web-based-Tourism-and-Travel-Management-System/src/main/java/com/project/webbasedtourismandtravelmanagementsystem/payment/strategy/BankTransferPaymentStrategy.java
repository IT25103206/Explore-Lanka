package com.project.webbasedtourismandtravelmanagementsystem.payment.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResult;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;

/** Online bank transfer: recorded as PENDING until the Finance Coordinator verifies it. */
@Component
public class BankTransferPaymentStrategy implements PaymentStrategy {

    @Override
    public Payment.Method method() {
        return Payment.Method.BANK_TRANSFER;
    }

    @Override
    public void validate(PaymentRequest r) {
        if (r.bankName() == null || r.bankName().isBlank()) {
            throw new BusinessException("Select the bank you transferred from");
        }
        if (r.bankReference() == null || !r.bankReference().trim().matches("^[A-Za-z0-9-]{6,30}$")) {
            throw new BusinessException("Enter the transfer reference number (6-30 letters or digits)");
        }
    }

    @Override
    public PaymentResult process(PaymentRequest r, BigDecimal amount) {
        return PaymentResult.pending(r.bankName().trim() + " ref " + r.bankReference().trim().toUpperCase(Locale.ROOT));
    }
}
