package com.project.webbasedtourismandtravelmanagementsystem.resource.model;


import com.project.webbasedtourismandtravelmanagementsystem.Partner.Model.Partner;
import com.project.webbasedtourismandtravelmanagementsystem.Event.Model.Event;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Table(name = "resources")
public class Resource {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resourceId;


    @Column(nullable = false)
    private String resourceName;


    private String resourceType;


    private String availabilityStatus;


    private Double cost;

    @Column(length = 100, unique = true)
    private String registrationNumber;

    private String location;

    private Integer capacity;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate availableFrom;

    private LocalDate availableUntil;



    // Partner relationship

    @ManyToOne
    @JoinColumn(name = "partner_id")
    private Partner partner;

    @ManyToOne
    @JoinColumn(name = "assigned_booking_id")
    private Booking assignedBooking;

    @ManyToOne
    @JoinColumn(name = "assigned_event_id")
    private Event assignedEvent;

    private LocalDate allocationStartDate;

    private LocalDate allocationEndDate;

    @Column(columnDefinition = "TEXT")
    private String allocationNotes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;



    public Resource() {

    }



    public Resource(String resourceName,
                    String resourceType,
                    String availabilityStatus,
                    Double cost) {

        this.resourceName = resourceName;
        this.resourceType = resourceType;
        this.availabilityStatus = availabilityStatus;
        this.cost = cost;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (availabilityStatus == null || availabilityStatus.isBlank()) availabilityStatus = "AVAILABLE";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }



    public Long getResourceId() {
        return resourceId;
    }


    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }



    public String getResourceName() {
        return resourceName;
    }


    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }



    public String getResourceType() {
        return resourceType;
    }


    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }



    public String getAvailabilityStatus() {
        return availabilityStatus;
    }


    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }



    public Double getCost() {
        return cost;
    }


    public void setCost(Double cost) {
        this.cost = cost;
    }



    public Partner getPartner() {
        return partner;
    }


    public void setPartner(Partner partner) {
        this.partner = partner;
    }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalDate availableFrom) { this.availableFrom = availableFrom; }
    public LocalDate getAvailableUntil() { return availableUntil; }
    public void setAvailableUntil(LocalDate availableUntil) { this.availableUntil = availableUntil; }
    public Booking getAssignedBooking() { return assignedBooking; }
    public void setAssignedBooking(Booking assignedBooking) { this.assignedBooking = assignedBooking; }
    public Event getAssignedEvent() { return assignedEvent; }
    public void setAssignedEvent(Event assignedEvent) { this.assignedEvent = assignedEvent; }
    public LocalDate getAllocationStartDate() { return allocationStartDate; }
    public void setAllocationStartDate(LocalDate allocationStartDate) { this.allocationStartDate = allocationStartDate; }
    public LocalDate getAllocationEndDate() { return allocationEndDate; }
    public void setAllocationEndDate(LocalDate allocationEndDate) { this.allocationEndDate = allocationEndDate; }
    public String getAllocationNotes() { return allocationNotes; }
    public void setAllocationNotes(String allocationNotes) { this.allocationNotes = allocationNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

}
