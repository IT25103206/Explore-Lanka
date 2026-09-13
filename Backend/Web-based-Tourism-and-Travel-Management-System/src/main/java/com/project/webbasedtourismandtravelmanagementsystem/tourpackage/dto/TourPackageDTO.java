package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto;


public class TourPackageDTO {


    private Long packageId;


    private String packageName;


    private String description;


    private Double price;


    private Integer durationDays;


    private String category;


    private String status;



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