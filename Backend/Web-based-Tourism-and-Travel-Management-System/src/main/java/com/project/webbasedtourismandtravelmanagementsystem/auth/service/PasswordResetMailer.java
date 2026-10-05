package com.project.webbasedtourismandtravelmanagementsystem.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Emails the password reset OTP. If no mail account is configured (MAIL_USERNAME / spring.mail.username empty),
 * the code is written to the console instead so the feature can still be tested locally.
 */
@Component
public class PasswordResetMailer {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetMailer.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String username;
    private final String from;

    public PasswordResetMailer(ObjectProvider<JavaMailSender> mailSender,
                               @Value("${spring.mail.username:}") String username,
                               @Value("${app.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.username = username == null ? "" : username.trim();
        this.from = from == null || from.isBlank() ? this.username : from.trim();
    }

    public void sendOtp(String to, String fullName, String code, long validMinutes) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || username.isEmpty()) {
            log.warn("Email is not configured (set MAIL_USERNAME and MAIL_PASSWORD). Password reset code for {}: {}", to, code);
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom("Explore Lanka <" + from + ">");
        msg.setTo(to);
        msg.setSubject("Your Explore Lanka verification code: " + code);
        msg.setText("Hi " + firstName(fullName) + ",\n\n"
                + "Use this code to reset the password for your Explore Lanka account:\n\n"
                + "    " + code + "\n\n"
                + "The code expires in " + validMinutes + " minutes and can be used once.\n"
                + "Never share this code with anyone - Explore Lanka staff will never ask for it.\n\n"
                + "If you didn't ask to reset your password, you can ignore this email - your password won't change.\n\n"
                + "Explore Lanka");
        try {
            sender.send(msg);
            log.info("Password reset code sent to {}", to);
        } catch (Exception e) {
            // never tell the visitor whether sending worked (that would reveal which emails have accounts)
            log.error("Could not send password reset code to {}: {}", to, e.getMessage());
        }
    }

    private static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "there";
        return fullName.trim().split("\\s+")[0];
    }
}
