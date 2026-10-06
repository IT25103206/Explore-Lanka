package com.project.webbasedtourismandtravelmanagementsystem.auth.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One "forgot password" OTP. Only a SHA-256 hash of the 6-digit code is stored.
 * A code expires after a few minutes, allows a limited number of wrong attempts and can be used once.
 */
@Entity
@Table(name = "password_reset_otps", indexes = @Index(name = "idx_reset_otp_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetOtp extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "code_hash", nullable = false, length = 64)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public PasswordResetOtp(User user, String codeHash, LocalDateTime expiresAt) {
        this.user = user;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
    }

    public boolean isOpen(LocalDateTime now, int maxAttempts) {
        return usedAt == null && attempts < maxAttempts && expiresAt.isAfter(now);
    }
}
