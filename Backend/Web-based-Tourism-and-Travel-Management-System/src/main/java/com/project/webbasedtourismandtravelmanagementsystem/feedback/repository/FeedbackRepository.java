package com.project.webbasedtourismandtravelmanagementsystem.feedback.repository;

import com.project.webbasedtourismandtravelmanagementsystem.feedback.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByTourPackageIdAndStatusNotOrderByCreatedAtDesc(Long packageId, Feedback.Status status);

    List<Feedback> findAllByOrderByCreatedAtDesc();

    Optional<Feedback> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);

    List<Feedback> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
