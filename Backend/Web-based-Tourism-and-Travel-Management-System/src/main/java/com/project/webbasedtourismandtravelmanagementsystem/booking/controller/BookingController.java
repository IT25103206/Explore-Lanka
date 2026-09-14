package com.project.webbasedtourismandtravelmanagementsystem.booking.controller;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {



    private final BookingService bookingService;



    public BookingController(
            BookingService bookingService) {

        this.bookingService = bookingService;
    }





    // CREATE BOOKING

    @PostMapping
    public Booking createBooking(
            @RequestBody Booking booking) {


        return bookingService
                .createBooking(booking);

    }



    // GET ALL BOOKINGS

    @GetMapping
    public List<Booking> getAllBookings() {


        return bookingService
                .getAllBookings();

    }


    // GET BOOKING BY ID

    @GetMapping("/{id}")
    public Booking getBookingById(
            @PathVariable Long id) {


        return bookingService
                .getBookingById(id);

    }





    // UPDATE BOOKING

    @PutMapping("/{id}")
    public Booking updateBooking(
            @PathVariable Long id,
            @RequestBody Booking booking) {


        return bookingService
                .updateBooking(id, booking);

    }



    // DELETE BOOKING

    @DeleteMapping("/{id}")
    public String deleteBooking(
            @PathVariable Long id) {


        bookingService.deleteBooking(id);


        return "Booking deleted successfully";

    }

}