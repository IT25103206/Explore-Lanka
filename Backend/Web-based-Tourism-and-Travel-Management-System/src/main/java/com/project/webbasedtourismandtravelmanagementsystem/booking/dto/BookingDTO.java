package com.project.webbasedtourismandtravelmanagementsystem.booking.dto;


import java.time.LocalDate;



public class BookingDTO {


    private Long bookingId;


    private Long customerId;


    private Long packageId;


    private LocalDate bookingDate;


    private LocalDate travelDate;


    private Integer numberOfPeople;


    private Double totalAmount;


    private String status;





    public Long getBookingId() {
        return bookingId;
    }


    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }



    public Long getCustomerId() {
        return customerId;
    }


    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }



    public Long getPackageId() {
        return packageId;
    }


    public void setPackageId(Long packageId) {
        this.packageId = packageId;
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
