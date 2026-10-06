package com.project.webbasedtourismandtravelmanagementsystem.resource.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "hotels")
@Getter
@Setter
@NoArgsConstructor
public class Hotel extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(nullable = false, length = 120)
    private String name;

    /** Town used to match hotels with package destinations, e.g. "Kandy". */
    @Column(nullable = false, length = 60)
    private String city;

    @Column(length = 255)
    private String address;

    @Column(name = "star_rating", nullable = false)
    private int starRating;

    /** Default number of rooms offered to Explore Lanka per night. */
    @Column(name = "total_rooms", nullable = false)
    private int totalRooms;

    @Column(name = "price_per_night", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerNight;

    @Column(length = 500)
    private String amenities;

    @Column(length = 1000)
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(nullable = false)
    private boolean active = true;
}
