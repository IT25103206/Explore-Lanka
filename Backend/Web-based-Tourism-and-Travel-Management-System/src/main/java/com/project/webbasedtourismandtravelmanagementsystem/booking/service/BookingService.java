package com.project.webbasedtourismandtravelmanagementsystem.booking.service;

import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDTO;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;

import java.util.List;

public interface BookingService {

    Booking createBooking(Booking booking);

    List<Booking> getAllBookings();

    Booking getBookingById(Long id);

    Booking updateBooking(Long id, Booking booking);

    void deleteBooking(Long id);

    // ===== Customer side =====

    Booking createCustomerBooking(BookingDTO dto);

    List<Booking> getBookingsByCustomer(Long customerId);

    Booking cancelBooking(Long bookingId, Long customerId);
}
