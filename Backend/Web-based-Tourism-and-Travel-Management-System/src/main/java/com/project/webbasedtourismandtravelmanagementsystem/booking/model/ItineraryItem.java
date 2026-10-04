package com.project.webbasedtourismandtravelmanagementsystem.booking.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "itinerary_items")
@Getter
@Setter
@NoArgsConstructor
public class ItineraryItem extends BaseEntity {

    /** ACTIVITY from the package plan, EVENT = a festival during the trip, WAYPOINT = added by the guide. */
    public enum Type { ACTIVITY, EVENT, WAYPOINT }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "itinerary_id", nullable = false)
    private Itinerary itinerary;

    @Column(name = "day_number", nullable = false)
    private int dayNumber;

    @Column(name = "item_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private Type type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 80)
    private String location;

    @Column(length = 300)
    private String route;

    @Column(name = "added_by", length = 120)
    private String addedBy;

    public ItineraryItem(int dayNumber, LocalDate date, Type type, String title, String description,
                         String location, String route, String addedBy) {
        this.dayNumber = dayNumber;
        this.date = date;
        this.type = type;
        this.title = title;
        this.description = description;
        this.location = location;
        this.route = route;
        this.addedBy = addedBy;
    }
}
