package com.project.webbasedtourismandtravelmanagementsystem.booking.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** The day-by-day travel plan generated for a confirmed booking. */
@Entity
@Table(name = "itineraries")
@Getter
@Setter
@NoArgsConstructor
public class Itinerary extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(length = 1000)
    private String notes;

    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, id ASC")
    private List<ItineraryItem> items = new ArrayList<>();

    public Itinerary(Booking booking) {
        this.booking = booking;
    }

    public void addItem(ItineraryItem item) {
        item.setItinerary(this);
        items.add(item);
    }
}
