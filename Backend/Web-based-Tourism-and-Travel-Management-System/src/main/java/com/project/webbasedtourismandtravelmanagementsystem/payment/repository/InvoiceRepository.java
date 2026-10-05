package com.project.webbasedtourismandtravelmanagementsystem.payment.repository;

import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByBookingId(Long bookingId);
}
