package com.project.webbasedtourismandtravelmanagementsystem.resource.model;


import jakarta.persistence.*;


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



    // Partner relationship

    @ManyToOne
    @JoinColumn(name = "partner_id")
    private Partner partner;



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

}