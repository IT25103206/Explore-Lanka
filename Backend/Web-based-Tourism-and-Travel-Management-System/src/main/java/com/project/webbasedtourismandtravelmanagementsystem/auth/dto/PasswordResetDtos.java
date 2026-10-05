package com.project.webbasedtourismandtravelmanagementsystem.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.PASSWORD;
import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.PASSWORD_MSG;

public final class PasswordResetDtos {

    private PasswordResetDtos() {
    }

    private static final String OTP = "^[0-9]{6}$";
    private static final String OTP_MSG = "Enter the 6-digit code from the email";

    /** Step 1: send a code to this email. */
    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") @Size(max = 120) String email) {
    }

    /** Step 2: check the code before showing the new-password form. */
    public record VerifyOtpRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") @Size(max = 120) String email,
            @NotBlank(message = "Enter the 6-digit code") @Pattern(regexp = OTP, message = OTP_MSG) String code) {
    }

    /** Step 3: set the new password (the code is checked again here). */
    public record ResetPasswordRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") @Size(max = 120) String email,
            @NotBlank(message = "Enter the 6-digit code") @Pattern(regexp = OTP, message = OTP_MSG) String code,
            @NotBlank(message = "New password is required") @Pattern(regexp = PASSWORD, message = PASSWORD_MSG) String password,
            @NotBlank(message = "Please confirm the new password") String confirmPassword) {
    }
}
