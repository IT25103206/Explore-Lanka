package com.project.webbasedtourismandtravelmanagementsystem.booking.repository;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

@Repository
public interface BookingRepository
        extends JpaRepository<Booking, Long> {

    // =========================================================
    // CUSTOMER BOOKINGS
    // =========================================================

    List<Booking> findByCustomer_UserIdOrderByBookingIdDesc(
            Long customerId
    );


    // =========================================================
    // PROMOTION COMPATIBILITY
    // =========================================================
    //
    // The current Booking entity has NO Promotion field.
    //
    // Old PromotionService code still calls:
    //
    // bookingRepository.findByPromotion_PromotionId(id)
    //
    // If this is declared as a normal Spring Data method,
    // Spring tries to find Booking.promotion and startup fails.
    //
    // Therefore keep this as a DEFAULT compatibility method.
    //
    // Until Promotion is actually added to Booking,
    // there is no database relationship we can query.
    // =========================================================

    default List<Booking> findByPromotion_PromotionId(
            Long promotionId
    ) {

        return Collections.emptyList();
    }
}