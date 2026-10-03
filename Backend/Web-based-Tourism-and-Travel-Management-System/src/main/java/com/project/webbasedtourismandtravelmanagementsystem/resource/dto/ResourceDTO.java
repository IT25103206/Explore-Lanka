package com.project.webbasedtourismandtravelmanagementsystem.resource.dto;

import java.time.LocalDate;

public class ResourceDTO {


    private Long resourceId;

    private String resourceName;

    private String resourceType;

    private String availabilityStatus;

    private Double cost;

    private Long partnerId;

    private String registrationNumber;
    private String location;
    private Integer capacity;
    private String description;
    private LocalDate availableFrom;
    private LocalDate availableUntil;
    private Long assignedBookingId;
    private Long assignedEventId;
    private LocalDate allocationStartDate;
    private LocalDate allocationEndDate;
    private String allocationNotes;



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



    public Long getPartnerId() {
        return partnerId;
    }


    public void setPartnerId(Long partnerId) {
        this.partnerId = partnerId;
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
    public Long getAssignedBookingId() { return assignedBookingId; }
    public void setAssignedBookingId(Long assignedBookingId) { this.assignedBookingId = assignedBookingId; }
    public Long getAssignedEventId() { return assignedEventId; }
    public void setAssignedEventId(Long assignedEventId) { this.assignedEventId = assignedEventId; }
    public LocalDate getAllocationStartDate() { return allocationStartDate; }
    public void setAllocationStartDate(LocalDate allocationStartDate) { this.allocationStartDate = allocationStartDate; }
    public LocalDate getAllocationEndDate() { return allocationEndDate; }
    public void setAllocationEndDate(LocalDate allocationEndDate) { this.allocationEndDate = allocationEndDate; }
    public String getAllocationNotes() { return allocationNotes; }
    public void setAllocationNotes(String allocationNotes) { this.allocationNotes = allocationNotes; }

}




