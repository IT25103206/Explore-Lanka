package com.project.webbasedtourismandtravelmanagementsystem.Event.Model;

import jakarta.persistence.*;
import java.time.LocalDate;


@Entity
@Table(name = "events")
public class Event {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;


    @Column(nullable = false)
    private String eventName;


    @Column(columnDefinition = "TEXT")
    private String description;


    private LocalDate eventDate;


    private String location;


    private String status;



    // Constructors

    public Event() {
    }


    public Event(String eventName,
                 String description,
                 LocalDate eventDate,
                 String location,
                 String status) {

        this.eventName = eventName;
        this.description = description;
        this.eventDate = eventDate;
        this.location = location;
        this.status = status;
    }



    // Getters and Setters


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
        {
            return status;
        }
    }


    public void setStatus(String status) {
        this.status = status;
    }

}