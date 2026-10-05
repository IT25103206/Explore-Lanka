package com.project.webbasedtourismandtravelmanagementsystem.payment.repository;

import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Refund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findAllByOrderByCreatedAtDesc();

    List<Refund> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    List<Refund> findByStatus(Refund.Status status);

    List<Refund> findByBookingCustomerIdOrderByCreatedAtDesc(Long customerId);

    long countByStatus(Refund.Status status);
}
