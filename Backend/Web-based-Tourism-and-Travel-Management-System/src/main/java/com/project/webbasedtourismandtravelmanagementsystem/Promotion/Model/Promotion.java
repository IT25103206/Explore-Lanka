package com.project.webbasedtourismandtravelmanagementsystem.Promotion.Model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "promotions")

public class Promotion {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long promotionId;

        @Column(nullable = false)
        private String title;

        @Column(columnDefinition = "TEXT")
        private String description;

        private Double discountPercentage;

        private LocalDate startDate;

        private LocalDate endDate;

        private String status;


        // Constructors

        public Promotion() {
        }


        public Promotion(String title, String description,
                         Double discountPercentage,
                         LocalDate startDate,
                         LocalDate endDate,
                         String status) {

            this.title = title;
            this.description = description;
            this.discountPercentage = discountPercentage;
            this.startDate = startDate;
            this.endDate = endDate;
            this.status = status;
        }


        // Getters and Setters

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
