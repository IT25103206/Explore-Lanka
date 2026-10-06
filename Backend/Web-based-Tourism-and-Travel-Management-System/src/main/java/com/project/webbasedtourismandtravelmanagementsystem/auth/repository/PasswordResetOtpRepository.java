package com.project.webbasedtourismandtravelmanagementsystem.auth.repository;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    void deleteByUserId(Long userId);

    /** The newest code of a user - only the latest code is ever accepted. */
    Optional<PasswordResetOtp> findFirstByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    boolean existsByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    @Modifying
    @Query("update PasswordResetOtp o set o.usedAt = :now where o.user.id = :userId and o.usedAt is null")
    int closeAllForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from PasswordResetOtp o where o.expiresAt < :before")
    int deleteExpiredBefore(@Param("before") LocalDateTime before);
}
