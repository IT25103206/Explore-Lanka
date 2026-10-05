package com.project.webbasedtourismandtravelmanagementsystem.auth.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** Extra profile data kept only for tourists (Customer Profile Management). */
@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
public class Customer extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 60)
    private String country;

    @Column(length = 60)
    private String nationality;

    @Column(length = 255)
    private String address;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "travel_preferences", length = 500)
    private String travelPreferences;

    /** Explicit consent for promotional e-mails (ethical requirement: no marketing without opt-in). */
    @Column(name = "marketing_consent", nullable = false)
    private boolean marketingConsent;

    public Customer(User user) {
        this.user = user;
    }
}
