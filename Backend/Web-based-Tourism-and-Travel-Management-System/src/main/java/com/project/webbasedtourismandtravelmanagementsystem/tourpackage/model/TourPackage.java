package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model;

import jakarta.persistence.*;


@Entity
@Table(name = "tour_packages")
public class TourPackage {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long packageId;


    @Column(nullable = false)
    private String packageName;


    @Column(columnDefinition = "TEXT")
    private String description;


    private Double price;


    private Integer durationDays;


    private String category;


    private String status;



    // Constructors

    public TourPackage() {

    }



    public TourPackage(String packageName,
                       String description,
                       Double price,
                       Integer durationDays,
                       String category,
                       String status) {

        this.packageName = packageName;
        this.description = description;
        this.price = price;
        this.durationDays = durationDays;
        this.category = category;
        this.status = status;
    }



    // Getters and Setters


    public Long getPackageId() {
        return packageId;
    }


    public void setPackageId(Long packageId) {
        this.packageId = packageId;
    }



    public String getPackageName() {
        return packageName;
    }


    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }



    public String getDescription() {
        return description;
    }


    public void setDescription(String description) {
        this.description = description;
    }



    public Double getPrice() {
        return price;
    }


    public void setPrice(Double price) {
        this.price = price;
    }



    public Integer getDurationDays() {
        return durationDays;
    }


    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }



    public String getCategory() {
        return category;
    }


    public void setCategory(String category) {
        this.category = category;
    }



    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }

}