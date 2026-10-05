package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.HotelAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HotelAvailabilityRepository extends JpaRepository<HotelAvailability, Long> {

    List<HotelAvailability> findByHotelIdAndDateBetweenOrderByDateAsc(Long hotelId, LocalDate from, LocalDate to);

    Optional<HotelAvailability> findByHotelIdAndDate(Long hotelId, LocalDate date);
}
