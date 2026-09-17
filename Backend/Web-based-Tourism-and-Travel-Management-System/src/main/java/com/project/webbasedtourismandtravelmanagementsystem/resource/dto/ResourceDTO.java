package com.project.webbasedtourismandtravelmanagementsystem.resource.dto;


public class ResourceDTO {


    private Long resourceId;

    private String resourceName;

    private String resourceType;

    private String availabilityStatus;

    private Double cost;

    private Long partnerId;



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

}




