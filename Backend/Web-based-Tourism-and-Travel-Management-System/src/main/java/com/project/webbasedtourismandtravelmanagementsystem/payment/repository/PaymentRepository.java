package com.project.webbasedtourismandtravelmanagementsystem.payment.repository;

import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    Optional<Payment> findFirstByBookingIdAndStatusOrderByCreatedAtDesc(Long bookingId, Payment.Status status);

    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findByBookingCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Payment> findByStatus(Payment.Status status);

    long countByStatus(Payment.Status status);
}
