package com.project.webbasedtourismandtravelmanagementsystem.notification.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService.NotificationResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Available to every logged-in user. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    public NotificationController(NotificationService notificationService, CurrentUser currentUser) {
        this.notificationService = notificationService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<NotificationResponse> list() {
        return notificationService.list(currentUser.id());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount(currentUser.id()));
    }

    @PostMapping("/{id}/read")
    public MessageResponse markRead(@PathVariable Long id) {
        notificationService.markRead(id, currentUser.id());
        return MessageResponse.of("Marked as read");
    }

    @PostMapping("/read-all")
    public MessageResponse markAllRead() {
        notificationService.markAllRead(currentUser.id());
        return MessageResponse.of("All notifications marked as read");
    }
}
