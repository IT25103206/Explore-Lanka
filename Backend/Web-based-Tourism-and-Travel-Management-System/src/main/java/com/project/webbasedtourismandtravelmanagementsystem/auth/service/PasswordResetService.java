package com.project.webbasedtourismandtravelmanagementsystem.auth.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.PasswordResetDtos.ResetPasswordRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.PasswordResetOtp;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.PasswordResetOtpRepository;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

/** Forgot password with an emailed 6-digit OTP: send code -> verify code -> set new password. */
@Service
public class PasswordResetService {

    public static final long VALID_MINUTES = 10;
    public static final int MAX_ATTEMPTS = 5;
    public static final long RESEND_COOLDOWN_SECONDS = 60;

    private static final String INVALID = "The code is incorrect or has expired. Check the email or request a new code.";

    private final UserRepository users;
    private final PasswordResetOtpRepository otps;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetMailer mailer;
    private final TransactionTemplate tx;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(UserRepository users, PasswordResetOtpRepository otps, PasswordEncoder passwordEncoder,
                                PasswordResetMailer mailer, TransactionTemplate tx) {
        this.users = users;
        this.otps = otps;
        this.passwordEncoder = passwordEncoder;
        this.mailer = mailer;
        this.tx = tx;
    }

    /** Step 1. Always answers the same way, so the page never reveals whether an email is registered. */
    public void sendCode(String rawEmail) {
        String email = normalise(rawEmail);
        record Pending(String to, String name, String code) { }

        Pending pending = tx.execute(status -> {
            LocalDateTime now = LocalDateTime.now();
            otps.deleteExpiredBefore(now.minusDays(1));
            User user = users.findByEmailIgnoreCase(email).orElse(null);
            if (user == null || !user.isActive()) {
                return null;
            }
            if (otps.existsByUserIdAndCreatedAtAfter(user.getId(), now.minusSeconds(RESEND_COOLDOWN_SECONDS))) {
                return null; // one code per minute is enough
            }
            otps.closeAllForUser(user.getId(), now);       // older codes stop working
            String code = String.format("%06d", random.nextInt(1_000_000));
            otps.save(new PasswordResetOtp(user, hash(user.getId(), code), now.plusMinutes(VALID_MINUTES)));
            return new Pending(user.getEmail(), user.getFullName(), code);
        });

        if (pending != null) {
            mailer.sendOtp(pending.to(), pending.name(), pending.code(), VALID_MINUTES);
        }
    }

    /** Step 2. Checks the code without using it up (wrong guesses still count). */
    public void verify(String email, String code) {
        Check result = tx.execute(status -> evaluate(email, code, LocalDateTime.now()));
        failIfBad(result);
    }

    /** Step 3. Checks the code again, changes the password and closes the code. */
    public void reset(ResetPasswordRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw new BusinessException("Passwords do not match");
        }
        Check result = tx.execute(status -> evaluate(req.email(), req.code(), LocalDateTime.now()));
        failIfBad(result);
        tx.executeWithoutResult(status -> {
            LocalDateTime now = LocalDateTime.now();
            PasswordResetOtp otp = otps.findById(result.otpId()).orElse(null);
            if (otp == null || !otp.isOpen(now, MAX_ATTEMPTS)) {
                throw new BusinessException(INVALID);
            }
            User user = otp.getUser();
            if (passwordEncoder.matches(req.password(), user.getPassword())) {
                throw new BusinessException("Choose a password you have not used before");
            }
            user.setPassword(passwordEncoder.encode(req.password()));
            users.save(user);
            otps.closeAllForUser(user.getId(), now);
        });
    }

    /** Outcome of checking a code. otpId is set only when the code is correct. */
    private record Check(Long otpId, String error) { }

    /**
     * Compares the code with the user's newest open OTP. Never throws, so a wrong attempt is committed
     * (an exception would roll the counter back and allow unlimited guesses).
     */
    private Check evaluate(String rawEmail, String code, LocalDateTime now) {
        User user = users.findByEmailIgnoreCase(normalise(rawEmail)).orElse(null);
        if (user == null || !user.isActive() || code == null) {
            return new Check(null, INVALID);
        }
        PasswordResetOtp otp = otps.findFirstByUserIdOrderByCreatedAtDescIdDesc(user.getId()).orElse(null);
        if (otp == null || !otp.isOpen(now, MAX_ATTEMPTS)) {
            return new Check(null, otp != null && otp.getUsedAt() == null && otp.getAttempts() >= MAX_ATTEMPTS
                    ? "Too many wrong attempts. Please request a new code." : INVALID);
        }
        boolean match = MessageDigest.isEqual(otp.getCodeHash().getBytes(StandardCharsets.UTF_8),
                hash(user.getId(), code.trim()).getBytes(StandardCharsets.UTF_8));
        if (match) {
            return new Check(otp.getId(), null);
        }
        otp.setAttempts(otp.getAttempts() + 1);
        otps.save(otp);
        int left = MAX_ATTEMPTS - otp.getAttempts();
        return new Check(null, left <= 0
                ? "Too many wrong attempts. Please request a new code."
                : "Incorrect code. " + left + (left == 1 ? " attempt" : " attempts") + " left.");
    }

    private static void failIfBad(Check result) {
        if (result == null || result.otpId() == null) {
            throw new BusinessException(result == null ? INVALID : result.error());
        }
    }

    private static String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static String hash(Long userId, String code) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest((userId + ":" + code).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
