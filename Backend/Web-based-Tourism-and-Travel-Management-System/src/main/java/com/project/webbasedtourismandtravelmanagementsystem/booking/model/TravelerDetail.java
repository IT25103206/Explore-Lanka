package com.project.webbasedtourismandtravelmanagementsystem.booking.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "traveler_details")
@Getter
@Setter
@NoArgsConstructor
public class TravelerDetail extends BaseEntity {

    public enum Type { ADULT, CHILD }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "traveler_type", nullable = false, length = 10)
    private Type type;

    @Column(nullable = false)
    private int age;

    @Column(length = 60)
    private String nationality;

    /** Passport or NIC number - shown masked to staff who do not need it in full. */
    @Column(name = "passport_or_nic", length = 30)
    private String passportOrNic;

    public TravelerDetail(String fullName, Type type, int age, String nationality, String passportOrNic) {
        this.fullName = fullName;
        this.type = type;
        this.age = age;
        this.nationality = nationality;
        this.passportOrNic = passportOrNic;
    }
}
