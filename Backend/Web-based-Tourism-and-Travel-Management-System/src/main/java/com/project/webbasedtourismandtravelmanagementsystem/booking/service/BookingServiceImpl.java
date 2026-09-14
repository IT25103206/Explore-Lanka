package com.project.webbasedtourismandtravelmanagementsystem.booking.service;


import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;


import org.springframework.stereotype.Service;


import java.util.List;



@Service
public class BookingServiceImpl
        implements BookingService {



    private final BookingRepository bookingRepository;



    public BookingServiceImpl(
            BookingRepository bookingRepository) {

        this.bookingRepository = bookingRepository;
    }





    @Override
    public Booking createBooking(
            Booking booking) {


        return bookingRepository.save(booking);

    }





    @Override
    public List<Booking> getAllBookings() {


        return bookingRepository.findAll();

    }





    @Override
    public Booking getBookingById(Long id) {


        return bookingRepository.findById(id)

                .orElseThrow(() ->
                        new RuntimeException(
                                "Booking not found"));

    }





    @Override
    public Booking updateBooking(
            Long id,
            Booking booking) {


        Booking existing =
                getBookingById(id);



        existing.setBookingDate(
                booking.getBookingDate());


        existing.setTravelDate(
                booking.getTravelDate());


        existing.setNumberOfPeople(
                booking.getNumberOfPeople());


        existing.setTotalAmount(
                booking.getTotalAmount());


        existing.setStatus(
                booking.getStatus());



        return bookingRepository.save(existing);

    }





    @Override
    public void deleteBooking(Long id) {


        bookingRepository.deleteById(id);

    }

}