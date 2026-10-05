package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** The plan for one day of a tour package, including the planned route (no GPS). */
@Entity
@Table(name = "package_itinerary_days")
@Getter
@Setter
@NoArgsConstructor
public class PackageItineraryDay extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private TourPackage tourPackage;

    @Column(name = "day_number", nullable = false)
    private int dayNumber;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 80)
    private String location;

    /** Planned route / waypoints, e.g. "Colombo -> Pinnawala -> Kandy". */
    @Column(length = 300)
    private String route;

    public PackageItineraryDay(int dayNumber, String title, String description, String location, String route) {
        this.dayNumber = dayNumber;
        this.title = title;
        this.description = description;
        this.location = location;
        this.route = route;
    }
}
