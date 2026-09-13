package com.project.webbasedtourismandtravelmanagementsystem.Promotion.dto;

import java.time.LocalDate;

public class Promotion_dto {

    private Long promotionId;

    private String title;

    private String description;

    private Double discountPercentage;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;


    public Long getPromotionId() {
        return promotionId;
    }


    public void setPromotionId(Long promotionId) {
        this.promotionId = promotionId;
    }


    public String getTitle() {
        return title;
    }


    public void setTitle(String title) {
        this.title = title;
    }


    public String getDescription() {
        return description;
    }


    public void setDescription(String description) {
        this.description = description;
    }


    public Double getDiscountPercentage() {
        return discountPercentage;
    }


    public void setDiscountPercentage(Double discountPercentage) {
        this.discountPercentage = discountPercentage;
    }


    public LocalDate getStartDate() {
        return startDate;
    }


    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }


    public LocalDate getEndDate() {
        return endDate;
    }


    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }


    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }
}