package com.project.webbasedtourismandtravelmanagementsystem.auth.dto;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Customer;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.*;

/** Request and response bodies for authentication, profiles and user management. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required") @Pattern(regexp = NAME, message = NAME_MSG) String fullName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") @Size(max = 120) String email,
            @Pattern(regexp = PHONE, message = PHONE_MSG) String phone,
            @Size(max = 60) String country,
            @NotBlank(message = "Password is required") @Pattern(regexp = PASSWORD, message = PASSWORD_MSG) String password,
            @NotBlank(message = "Please confirm your password") String confirmPassword,
            boolean marketingConsent,
            @AssertTrue(message = "You must accept the terms and privacy policy") boolean acceptTerms) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password,
            /* "customer" or "staff" - which login page was used */
            String portal) {
    }

    public record UserResponse(Long id, String fullName, String email, String phone, Role role, String roleName,
                               boolean staff, boolean partner, boolean active, Long supplierId, String supplierName,
                               LocalDateTime lastLoginAt, LocalDateTime createdAt) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(),
                    u.getRole().getDisplayName(), u.getRole().isStaff(), u.getRole().isPartner(), u.isActive(),
                    u.getSupplier() == null ? null : u.getSupplier().getId(),
                    u.getSupplier() == null ? null : u.getSupplier().getName(),
                    u.getLastLoginAt(), u.getCreatedAt());
        }
    }

    public record ProfileResponse(UserResponse user, String country, String nationality, String address,
                                  LocalDate dateOfBirth, String travelPreferences, boolean marketingConsent) {
        public static ProfileResponse from(User u, Customer c) {
            if (c == null) {
                return new ProfileResponse(UserResponse.from(u), null, null, null, null, null, false);
            }
            return new ProfileResponse(UserResponse.from(u), c.getCountry(), c.getNationality(), c.getAddress(),
                    c.getDateOfBirth(), c.getTravelPreferences(), c.isMarketingConsent());
        }
    }

    public record ProfileUpdateRequest(
            @NotBlank(message = "Full name is required") @Pattern(regexp = NAME, message = NAME_MSG) String fullName,
            @Pattern(regexp = PHONE, message = PHONE_MSG) String phone,
            @Size(max = 60) String country,
            @Size(max = 60) String nationality,
            @Size(max = 255) String address,
            @Past(message = "Date of birth must be in the past") LocalDate dateOfBirth,
            @Size(max = 500, message = "Keep travel preferences under 500 characters") String travelPreferences,
            boolean marketingConsent) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required") String currentPassword,
            @NotBlank(message = "New password is required") @Pattern(regexp = PASSWORD, message = PASSWORD_MSG) String newPassword,
            @NotBlank(message = "Please confirm the new password") String confirmPassword) {
    }

    public record StaffUserRequest(
            @NotBlank(message = "Full name is required") @Pattern(regexp = NAME, message = NAME_MSG) String fullName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @Pattern(regexp = PHONE, message = PHONE_MSG) String phone,
            @NotNull(message = "Choose a role") Role role,
            @NotBlank(message = "Password is required") @Pattern(regexp = PASSWORD, message = PASSWORD_MSG) String password,
            Long supplierId) {
    }

    public record UserUpdateRequest(
            @NotBlank(message = "Full name is required") @Pattern(regexp = NAME, message = NAME_MSG) String fullName,
            @Pattern(regexp = PHONE, message = PHONE_MSG) String phone,
            @NotNull(message = "Choose a role") Role role,
            boolean active,
            Long supplierId) {
    }

    public record RoleOption(Role value, String label, boolean staff, boolean partner) {
    }
}
