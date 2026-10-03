package com.project.webbasedtourismandtravelmanagementsystem.Event.dto;


import java.time.LocalDate;


public class EventDTO {


    private Long eventId;

    private String eventName;

    private String description;

    private LocalDate eventDate;

    private String location;

    private String status;



    public Long getEventId() {
        return eventId;
    }


    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }


    public String getEventName() {
        return eventName;
    }


    public void setEventName(String eventName) {
        this.eventName = eventName;
    }


    public String getDescription() {
        return description;
    }


    public void setDescription(String description) {
        this.description = description;
    }


    public LocalDate getEventDate() {
        return eventDate;
    }


    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }


    public String getLocation() {
        return location;
    }


    public void setLocation(String location) {
        this.location = location;
    }


    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }

}