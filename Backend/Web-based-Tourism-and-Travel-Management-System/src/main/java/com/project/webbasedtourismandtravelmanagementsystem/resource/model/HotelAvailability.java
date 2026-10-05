package com.project.webbasedtourismandtravelmanagementsystem.resource.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Room capacity and bookings of a hotel for one night.
 * When no row exists for a date the hotel's default total rooms apply and nothing is booked.
 */
@Entity
@Table(name = "hotel_availability",
        uniqueConstraints = @UniqueConstraint(name = "uk_hotel_date", columnNames = {"hotel_id", "stay_date"}))
@Getter
@Setter
@NoArgsConstructor
public class HotelAvailability extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(name = "stay_date", nullable = false)
    private LocalDate date;

    /** Rooms the partner makes available for this night (UC-03). */
    @Column(name = "available_rooms", nullable = false)
    private int availableRooms;

    /** Rooms already allocated to Explore Lanka bookings. */
    @Column(name = "booked_rooms", nullable = false)
    private int bookedRooms;

    @Version
    private Long lockVersion;

    public HotelAvailability(Hotel hotel, LocalDate date) {
        this.hotel = hotel;
        this.date = date;
        this.availableRooms = hotel.getTotalRooms();
        this.bookedRooms = 0;
    }

    public int freeRooms() {
        return Math.max(0, availableRooms - bookedRooms);
    }
}
