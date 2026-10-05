package com.project.webbasedtourismandtravelmanagementsystem.payment.service;

import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

/** The gateway refused the payment (UC-06 extension 7a). The failed attempt is still recorded. */
public class PaymentDeclinedException extends BusinessException {

    public PaymentDeclinedException(String reason) {
        super(HttpStatus.PAYMENT_REQUIRED, reason + ". Please try again or choose another payment method.");
    }
}
