package com.project.webbasedtourismandtravelmanagementsystem.notification.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** In-app notifications (Notification Management minor function). */
@Service
@Transactional
public class NotificationService {

    public record NotificationResponse(Long id, Notification.Type type, String title, String message,
                                       String link, boolean read, LocalDateTime createdAt) {
        static NotificationResponse from(Notification n) {
            return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(), n.getLink(),
                    n.isRead(), n.getCreatedAt());
        }
    }

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void notify(User recipient, Notification.Type type, String title, String message, String link) {
        if (recipient == null) {
            return;
        }
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setLink(link);
        notificationRepository.save(n);
    }

    public void notifyRole(Role role, Notification.Type type, String title, String message, String link) {
        userRepository.findByRoleAndActiveTrue(role).forEach(u -> notify(u, type, title, message, link));
    }

    /**
     * Same as {@link #notifyRole} but committed in its own transaction, so the message is kept
     * even when the caller then rejects the request (e.g. a UC-03 schedule conflict).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyRoleIndependently(Role role, Notification.Type type, String title, String message, String link) {
        notifyRole(role, type, title, message, link);
    }

    public void notifySupplierUsers(Long supplierId, Notification.Type type, String title, String message, String link) {
        if (supplierId == null) {
            return;
        }
        userRepository.findBySupplierIdAndActiveTrue(supplierId).forEach(u -> notify(u, type, title, message, link));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId) {
        return notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markRead(Long id, Long userId) {
        Notification n = notificationRepository.findById(id)
                .filter(x -> x.getRecipient().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Notification", id));
        n.setRead(true);
    }

    public void markAllRead(Long userId) {
        notificationRepository.findByRecipientIdAndReadFalse(userId).forEach(n -> n.setRead(true));
    }
}
