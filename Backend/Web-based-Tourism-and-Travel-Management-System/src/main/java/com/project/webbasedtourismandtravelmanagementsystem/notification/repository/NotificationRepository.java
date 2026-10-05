package com.project.webbasedtourismandtravelmanagementsystem.notification.repository;

import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<Notification> findByRecipientIdAndReadFalse(Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);
}
