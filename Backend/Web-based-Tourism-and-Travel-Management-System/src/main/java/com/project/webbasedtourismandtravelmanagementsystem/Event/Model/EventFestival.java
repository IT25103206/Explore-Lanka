package com.project.webbasedtourismandtravelmanagementsystem.event.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

/** A Sri Lankan cultural festival or event listing (UC-04). */
@Entity
@Table(name = "events_festivals")
@Getter
@Setter
@NoArgsConstructor
public class EventFestival extends BaseEntity {

    public enum Category { CULTURAL_FESTIVAL, RELIGIOUS, MUSIC, FOOD_AND_DRINK, EXHIBITION, SPORTS, ENTERTAINMENT }

    /** DRAFT is hidden from customers; EXPIRED is set automatically every night. */
    public enum Status { DRAFT, PUBLISHED, DEACTIVATED, EXPIRED }

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(length = 2000)
    private String description;

    /** Province, e.g. "Central". */
    @Column(nullable = false, length = 40)
    private String region;

    /** Venue / town, e.g. "Temple of the Tooth, Kandy". Used for clash detection. */
    @Column(nullable = false, length = 150)
    private String location;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "dress_code", length = 150)
    private String dressCode;

    @Column(name = "max_participants", nullable = false)
    private int maxParticipants;

    @Column(name = "ticket_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal ticketPrice = BigDecimal.ZERO;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @Column(name = "created_by", length = 120)
    private String createdBy;

    /** Featured events are linked to suitable tour packages by the Marketing Executive. */
    @ManyToMany
    @JoinTable(name = "event_packages",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "package_id"))
    private Set<TourPackage> linkedPackages = new HashSet<>();
}
