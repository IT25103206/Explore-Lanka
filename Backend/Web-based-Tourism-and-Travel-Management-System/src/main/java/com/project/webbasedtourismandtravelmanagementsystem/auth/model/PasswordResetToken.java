package com.project.webbasedtourismandtravelmanagementsystem.auth.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One "forgot password" request. Only the SHA-256 hash of the token is stored, so a leaked
 * database cannot be used to reset passwords. Tokens expire and can be used once.
 */
@Entity
@Table(name = "password_reset_tokens", indexes = @Index(name = "idx_reset_token_hash", columnList = "token_hash", unique = true))
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public PasswordResetToken(User user, String tokenHash, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public boolean isUsable(LocalDateTime now) {
        return usedAt == null && expiresAt.isAfter(now);
    }
}
