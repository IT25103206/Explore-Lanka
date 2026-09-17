package com.project.webbasedtourismandtravelmanagementsystem.booking.repository;


import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface BookingRepository
        extends JpaRepository<Booking, Long> {


}
