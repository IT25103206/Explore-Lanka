package com.project.webbasedtourismandtravelmanagementsystem.booking.repository;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByReference(String reference);

    boolean existsByReference(String reference);

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByStartDateAsc(BookingStatus status);

    List<Booking> findByStatusAndEndDateBefore(BookingStatus status, LocalDate date);

    List<Booking> findByStatusIn(Collection<BookingStatus> statuses);

    long countByStatus(BookingStatus status);

    long countByCustomerIdAndStatusIn(Long customerId, Collection<BookingStatus> statuses);

    boolean existsByTourPackageId(Long packageId);

    boolean existsByCustomerId(Long customerId);

    List<Booking> findTop6ByOrderByCreatedAtDesc();

    List<Booking> findByPromotionId(Long promotionId);
}
