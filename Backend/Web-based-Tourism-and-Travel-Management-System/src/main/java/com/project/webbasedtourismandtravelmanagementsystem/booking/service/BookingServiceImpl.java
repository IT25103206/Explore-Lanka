package com.project.webbasedtourismandtravelmanagementsystem.booking.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDTO;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    private static final int MAX_PEOPLE = 50;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TourPackageRepository tourPackageRepository;


    public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            TourPackageRepository tourPackageRepository) {

        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.tourPackageRepository = tourPackageRepository;
    }


    // =========================================================
    // CREATE BOOKING
    // =========================================================

    @Override
    public Booking createBooking(
            Booking booking) {

        return bookingRepository.save(
                booking
        );
    }


    // =========================================================
    // GET ALL BOOKINGS
    // =========================================================

    @Override
    public List<Booking> getAllBookings() {

        return bookingRepository.findAll();
    }


    // =========================================================
    // GET BOOKING
    // =========================================================

    @Override
    public Booking getBookingById(
            Long id) {

        return bookingRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Booking not found"
                        )
                );
    }


    // =========================================================
    // UPDATE BOOKING
    // =========================================================

    @Override
    public Booking updateBooking(
            Long id,
            Booking booking) {

        Booking existing =
                getBookingById(id);

        existing.setBookingDate(
                booking.getBookingDate()
        );

        existing.setTravelDate(
                booking.getTravelDate()
        );

        existing.setNumberOfPeople(
                booking.getNumberOfPeople()
        );

        existing.setTotalAmount(
                booking.getTotalAmount()
        );

        existing.setStatus(
                booking.getStatus()
        );

        existing.setPickupLocation(
                booking.getPickupLocation()
        );

        existing.setSpecialRequests(
                booking.getSpecialRequests()
        );

        return bookingRepository.save(
                existing
        );
    }


    // =========================================================
    // DELETE BOOKING
    // =========================================================

    @Override
    public void deleteBooking(
            Long id) {

        bookingRepository.deleteById(
                id
        );
    }


    // =========================================================
    // CUSTOMER - CREATE BOOKING
    // =========================================================

    @Override
    public Booking createCustomerBooking(
            BookingDTO dto) {

        // -----------------------------------------------------
        // CUSTOMER
        // -----------------------------------------------------

        if (dto.getCustomerId() == null) {

            throw new IllegalArgumentException(
                    "Please log in again to make a booking."
            );
        }


        // -----------------------------------------------------
        // PACKAGE
        // -----------------------------------------------------

        if (dto.getPackageId() == null) {

            throw new IllegalArgumentException(
                    "Please select a tour package."
            );
        }


        // -----------------------------------------------------
        // TRAVEL DATE
        // -----------------------------------------------------

        if (dto.getTravelDate() == null) {

            throw new IllegalArgumentException(
                    "Please select a travel date."
            );
        }


        if (!dto.getTravelDate()
                .isAfter(LocalDate.now())) {

            throw new IllegalArgumentException(
                    "Travel date must be a future date."
            );
        }


        // -----------------------------------------------------
        // NUMBER OF PEOPLE
        // -----------------------------------------------------

        Integer people =
                dto.getNumberOfPeople();


        if (people == null
                || people < 1
                || people > MAX_PEOPLE) {

            throw new IllegalArgumentException(
                    "Number of travelers must be between 1 and "
                            + MAX_PEOPLE
                            + "."
            );
        }


        // -----------------------------------------------------
        // FIND CUSTOMER
        // -----------------------------------------------------

        User customer =
                userRepository
                        .findById(
                                dto.getCustomerId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Customer account not found."
                                )
                        );


        // -----------------------------------------------------
        // FIND TOUR PACKAGE
        // -----------------------------------------------------

        TourPackage tourPackage =
                tourPackageRepository
                        .findById(
                                dto.getPackageId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Selected tour package not found."
                                )
                        );


        // -----------------------------------------------------
        // CHECK PACKAGE STATUS
        // -----------------------------------------------------

        if (tourPackage.getStatus()
                == TourPackage.Status.INACTIVE) {

            throw new IllegalArgumentException(
                    "This tour package is not available right now."
            );
        }


        // -----------------------------------------------------
        // CHECK PACKAGE AVAILABILITY DATES
        // -----------------------------------------------------

        if (tourPackage.getAvailableFrom() != null
                && dto.getTravelDate()
                .isBefore(
                        tourPackage.getAvailableFrom()
                )) {

            throw new IllegalArgumentException(
                    "This tour package is not available on the selected date."
            );
        }


        if (tourPackage.getAvailableTo() != null
                && dto.getTravelDate()
                .isAfter(
                        tourPackage.getAvailableTo()
                )) {

            throw new IllegalArgumentException(
                    "This tour package is not available on the selected date."
            );
        }


        // -----------------------------------------------------
        // CHECK GROUP SIZE
        // -----------------------------------------------------

        if (tourPackage.getMaxGroupSize() > 0
                && people > tourPackage.getMaxGroupSize()) {

            throw new IllegalArgumentException(
                    "This package allows a maximum of "
                            + tourPackage.getMaxGroupSize()
                            + " travelers."
            );
        }


        // -----------------------------------------------------
        // CALCULATE PRICE
        // -----------------------------------------------------

        /*
         * Actual TourPackage API:
         *
         * pricePerAdult(LocalDate travelDate)
         *
         * It returns BigDecimal.
         */

        BigDecimal pricePerAdult =
                tourPackage.pricePerAdult(
                        dto.getTravelDate()
                );


        if (pricePerAdult == null) {

            pricePerAdult =
                    BigDecimal.ZERO;
        }


        BigDecimal total =
                pricePerAdult.multiply(
                        BigDecimal.valueOf(
                                people
                        )
                );


        // -----------------------------------------------------
        // CREATE BOOKING
        // -----------------------------------------------------

        Booking booking =
                new Booking();


        booking.setCustomer(
                customer
        );


        booking.setTourPackage(
                tourPackage
        );


        booking.setBookingDate(
                LocalDate.now()
        );


        booking.setTravelDate(
                dto.getTravelDate()
        );


        booking.setNumberOfPeople(
                people
        );


        /*
         * Booking.totalAmount is Double,
         * so convert BigDecimal -> double.
         */
        booking.setTotalAmount(
                total.doubleValue()
        );


        booking.setStatus(
                "PENDING"
        );


        booking.setPickupLocation(
                trimOrNull(
                        dto.getPickupLocation()
                )
        );


        booking.setSpecialRequests(
                trimOrNull(
                        dto.getSpecialRequests()
                )
        );


        return bookingRepository.save(
                booking
        );
    }


    // =========================================================
    // CUSTOMER - BOOKINGS
    // =========================================================

    @Override
    public List<Booking> getBookingsByCustomer(
            Long customerId) {

        return bookingRepository
                .findByCustomer_UserIdOrderByBookingIdDesc(
                        customerId
                );
    }


    // =========================================================
    // CUSTOMER - CANCEL BOOKING
    // =========================================================

    @Override
    public Booking cancelBooking(
            Long bookingId,
            Long customerId) {

        Booking booking =
                getBookingById(
                        bookingId
                );


        if (booking.getCustomer() == null
                || customerId == null
                || booking.getCustomer().getUserId() == null
                || !booking
                .getCustomer()
                .getUserId()
                .equals(customerId)) {

            throw new IllegalArgumentException(
                    "You can only cancel your own bookings."
            );
        }


        String status =
                booking.getStatus() == null
                        ? ""
                        : booking
                        .getStatus()
                        .trim()
                        .toUpperCase();


        if (status.equals("CANCELLED")
                || status.equals("COMPLETED")) {

            throw new IllegalArgumentException(
                    "This booking is already "
                            + status.toLowerCase()
                            + "."
            );
        }


        if (booking.getTravelDate() != null
                && !booking
                .getTravelDate()
                .isAfter(LocalDate.now())) {

            throw new IllegalArgumentException(
                    "Bookings can only be cancelled before the travel date."
            );
        }


        booking.setStatus(
                "CANCELLED"
        );


        return bookingRepository.save(
                booking
        );
    }


    // =========================================================
    // HELPER
    // =========================================================

    private String trimOrNull(
            String value) {

        if (value == null) {
            return null;
        }


        String trimmed =
                value.trim();


        return trimmed.isEmpty()
                ? null
                : trimmed;
    }
}