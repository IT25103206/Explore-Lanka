package com.project.webbasedtourismandtravelmanagementsystem.auth.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.PasswordResetDtos.ForgotPasswordRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.PasswordResetDtos.ResetPasswordRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.PasswordResetDtos.VerifyOtpRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.service.PasswordResetService;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public forgot-password endpoints (under /api/auth, which SecurityConfig permits). */
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService service;

    public PasswordResetController(PasswordResetService service) {
        this.service = service;
    }

    @PostMapping("/forgot-password")
    public MessageResponse sendCode(@Valid @RequestBody ForgotPasswordRequest request) {
        service.sendCode(request.email());
        return MessageResponse.of("If an account exists for that email, we've sent a 6-digit code to it.");
    }

    @PostMapping("/verify-otp")
    public MessageResponse verify(@Valid @RequestBody VerifyOtpRequest request) {
        service.verify(request.email(), request.code());
        return MessageResponse.of("Code verified. Choose a new password.");
    }

    @PostMapping("/reset-password")
    public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest request) {
        service.reset(request);
        return MessageResponse.of("Your password has been changed. You can now log in.");
    }
}
