package com.project.webbasedtourismandtravelmanagementsystem.payment.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentResponse;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.RefundDecision;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.VerifyRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.PaymentService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService.RefundResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Payments, bank-transfer verification and refunds (Finance & Booking Coordinator). */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize(Access.FINANCE)
public class PaymentAdminController {

    private final PaymentService paymentService;
    private final RefundService refundService;
    private final CurrentUser currentUser;

    public PaymentAdminController(PaymentService paymentService, RefundService refundService, CurrentUser currentUser) {
        this.paymentService = paymentService;
        this.refundService = refundService;
        this.currentUser = currentUser;
    }

    @GetMapping("/payments")
    public List<PaymentResponse> payments() {
        return paymentService.all();
    }

    @PostMapping("/payments/{id}/verify")
    public MessageResponse verify(@PathVariable Long id, @Valid @RequestBody VerifyRequest request) {
        PaymentResponse p = paymentService.verifyBankTransfer(id, request.approve(), request.note(), currentUser.details().getFullName());
        return MessageResponse.of(request.approve() ? "Transfer verified - booking confirmed" : "Transfer rejected - customer notified", p);
    }

    @GetMapping("/refunds")
    public List<RefundResponse> refunds() {
        return refundService.list();
    }

    @PostMapping("/refunds/{id}")
    public MessageResponse decide(@PathVariable Long id, @Valid @RequestBody RefundDecision request) {
        RefundResponse r = refundService.process(id, request.approve(), request.note(), currentUser.details().getFullName());
        return MessageResponse.of(request.approve() ? "Refund approved" : "Refund rejected", r);
    }
}
