package com.project.webbasedtourismandtravelmanagementsystem.booking.model;


import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;

import jakarta.persistence.*;

        import java.time.LocalDate;



@Entity
@Table(name = "bookings")
public class Booking {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;



    // Customer who made booking

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;




    // Selected tour package

    @ManyToOne
    @JoinColumn(name = "package_id")
    private TourPackage tourPackage;




    private LocalDate bookingDate;


    private LocalDate travelDate;


    private Integer numberOfPeople;


    private Double totalAmount;


    private String status;




    // Constructors


    public Booking() {

    }



    public Booking(LocalDate bookingDate,
                   LocalDate travelDate,
                   Integer numberOfPeople,
                   Double totalAmount,
                   String status) {

        this.bookingDate = bookingDate;
        this.travelDate = travelDate;
        this.numberOfPeople = numberOfPeople;
        this.totalAmount = totalAmount;
        this.status = status;
    }





    // Getters and Setters


    public Long getBookingId() {
        return bookingId;
    }


    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }



    public User getCustomer() {
        return customer;
    }


    public void setCustomer(User customer) {
        this.customer = customer;
    }



    public TourPackage getTourPackage() {
        return tourPackage;
    }


    public void setTourPackage(TourPackage tourPackage) {
        this.tourPackage = tourPackage;
    }



    public LocalDate getBookingDate() {
        return bookingDate;
    }


    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }



    public LocalDate getTravelDate() {
        return travelDate;
    }


    public void setTravelDate(LocalDate travelDate) {
        this.travelDate = travelDate;
    }



    public Integer getNumberOfPeople() {
        return numberOfPeople;
    }


    public void setNumberOfPeople(Integer numberOfPeople) {
        this.numberOfPeople = numberOfPeople;
    }



    public Double getTotalAmount() {
        return totalAmount;
    }


    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }



    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }

}
