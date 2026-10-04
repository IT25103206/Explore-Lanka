package com.project.webbasedtourismandtravelmanagementsystem.resource.model;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "tour_guides")
@Getter
@Setter
@NoArgsConstructor
public class TourGuide extends BaseEntity {

    /** Login account of the guide (optional - not every guide uses the portal). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "license_no", nullable = false, unique = true, length = 30)
    private String licenseNo;

    @Column(nullable = false, length = 200)
    private String languages;

    @Column(length = 200)
    private String specialization;

    @Column(name = "experience_years", nullable = false)
    private int experienceYears;

    @Column(name = "price_per_day", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerDay;

    @Column(length = 20)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(nullable = false)
    private boolean active = true;
}
