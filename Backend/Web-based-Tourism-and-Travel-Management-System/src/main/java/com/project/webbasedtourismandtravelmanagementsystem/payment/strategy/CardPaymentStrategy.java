package com.project.webbasedtourismandtravelmanagementsystem.payment.strategy;

import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResult;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.YearMonth;

/**
 * Credit / debit card (simulated). Only the brand and last four digits are stored.
 * Test cards: 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined.
 */
@Component
public class CardPaymentStrategy implements PaymentStrategy {

    @Override
    public Payment.Method method() {
        return Payment.Method.CARD;
    }

    @Override
    public void validate(PaymentRequest r) {
        if (r.cardHolder() == null || !r.cardHolder().trim().matches("^[A-Za-z][A-Za-z .'-]{1,99}$")) {
            throw new BusinessException("Enter the name shown on the card");
        }
        String number = digits(r.cardNumber());
        if (number.length() < 13 || number.length() > 19 || !luhn(number)) {
            throw new BusinessException("The card number is not valid");
        }
        if (r.expiry() == null || !r.expiry().matches("^(0[1-9]|1[0-2])/\\d{2}$")) {
            throw new BusinessException("Enter the expiry date as MM/YY");
        }
        YearMonth exp = YearMonth.of(2000 + Integer.parseInt(r.expiry().substring(3)), Integer.parseInt(r.expiry().substring(0, 2)));
        if (exp.isBefore(YearMonth.now())) {
            throw new BusinessException("This card has expired");
        }
        if (r.cvv() == null || !r.cvv().matches("^\\d{3,4}$")) {
            throw new BusinessException("The CVV is the 3 or 4 digits on the back of the card");
        }
    }

    @Override
    public PaymentResult process(PaymentRequest r, BigDecimal amount) {
        String number = digits(r.cardNumber());
        String masked = brand(number) + " **** " + number.substring(number.length() - 4);
        if (number.endsWith("0002")) {
            return PaymentResult.failed(masked, "The card was declined by the issuing bank");
        }
        if (number.endsWith("9995")) {
            return PaymentResult.failed(masked, "Insufficient funds on this card");
        }
        return PaymentResult.success(masked);
    }

    static String digits(String s) {
        return s == null ? "" : s.replaceAll("[\\s-]", "");
    }

    static boolean luhn(String number) {
        if (!number.matches("\\d+")) {
            return false;
        }
        int sum = 0;
        boolean dbl = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            int d = number.charAt(i) - '0';
            if (dbl) {
                d *= 2;
                if (d > 9) {
                    d -= 9;
                }
            }
            sum += d;
            dbl = !dbl;
        }
        return sum % 10 == 0;
    }

    private static String brand(String number) {
        if (number.startsWith("4")) {
            return "VISA";
        }
        if (number.matches("^(5[1-5]|2[2-7]).*")) {
            return "MASTERCARD";
        }
        if (number.matches("^3[47].*")) {
            return "AMEX";
        }
        return "CARD";
    }
}
