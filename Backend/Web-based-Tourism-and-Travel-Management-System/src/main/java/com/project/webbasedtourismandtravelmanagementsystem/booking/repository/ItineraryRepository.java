package com.project.webbasedtourismandtravelmanagementsystem.booking.repository;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {

    Optional<Itinerary> findByBookingId(Long bookingId);
}
