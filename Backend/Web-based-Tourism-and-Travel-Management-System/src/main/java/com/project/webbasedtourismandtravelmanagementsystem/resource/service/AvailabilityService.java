package com.project.webbasedtourismandtravelmanagementsystem.resource.service;

import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.ResourceOption;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Real-time availability of hotels, vehicles and guides ("CentralBookingSystem.checkResourceAvailability()"
 * in the sequence diagrams). Used by booking (UC-06), allocation (UC-01) and partner schedules (UC-03).
 *
 * Date conventions: hotels are booked per NIGHT, i.e. [startDate, endDate) ;
 * vehicles and guides are booked per DAY, i.e. [startDate, endDate] inclusive.
 */
@Service
@Transactional(readOnly = true)
public class AvailabilityService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final ResourceBlockedDateRepository blockedDateRepository;
    private final ResourceAllocationRepository allocationRepository;

    public AvailabilityService(HotelRepository hotelRepository, HotelAvailabilityRepository hotelAvailabilityRepository,
                               VehicleRepository vehicleRepository, TourGuideRepository guideRepository,
                               ResourceBlockedDateRepository blockedDateRepository,
                               ResourceAllocationRepository allocationRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository = hotelAvailabilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.blockedDateRepository = blockedDateRepository;
        this.allocationRepository = allocationRepository;
    }

    // ------------------------------------------------------------------ hotels

    /** Smallest number of free rooms over all nights in [start, endExclusive). */
    public int freeRooms(Hotel hotel, LocalDate start, LocalDate endExclusive) {
        if (!endExclusive.isAfter(start)) {
            return hotel.getTotalRooms();
        }
        Map<LocalDate, HotelAvailability> rows = new HashMap<>();
        hotelAvailabilityRepository.findByHotelIdAndDateBetweenOrderByDateAsc(hotel.getId(), start, endExclusive.minusDays(1))
                .forEach(r -> rows.put(r.getDate(), r));
        int min = Integer.MAX_VALUE;
        for (LocalDate d = start; d.isBefore(endExclusive); d = d.plusDays(1)) {
            HotelAvailability row = rows.get(d);
            min = Math.min(min, row == null ? hotel.getTotalRooms() : row.freeRooms());
        }
        return min;
    }

    /** Nights in the range that do not have enough free rooms (UC-01 6b conflict details). */
    public List<String> hotelConflicts(Hotel hotel, LocalDate start, LocalDate endExclusive, int rooms) {
        List<String> problems = new ArrayList<>();
        if (!usable(hotel.isActive(), hotel.getSupplier())) {
            problems.add(hotel.getName() + " is inactive or its supplier has been removed");
            return problems;
        }
        Map<LocalDate, HotelAvailability> rows = new HashMap<>();
        hotelAvailabilityRepository.findByHotelIdAndDateBetweenOrderByDateAsc(hotel.getId(), start, endExclusive.minusDays(1))
                .forEach(r -> rows.put(r.getDate(), r));
        for (LocalDate d = start; d.isBefore(endExclusive); d = d.plusDays(1)) {
            HotelAvailability row = rows.get(d);
            int free = row == null ? hotel.getTotalRooms() : row.freeRooms();
            if (free < rooms) {
                problems.add(hotel.getName() + ": only " + free + " room(s) free on " + DAY.format(d) + " (need " + rooms + ")");
            }
        }
        return problems;
    }

    public List<ResourceOption> hotelOptions(Collection<String> cities, LocalDate start, LocalDate endExclusive, int rooms) {
        Set<String> wanted = new HashSet<>();
        cities.forEach(c -> wanted.add(c.trim().toLowerCase(Locale.ROOT)));
        List<ResourceOption> inArea = new ArrayList<>();
        List<ResourceOption> elsewhere = new ArrayList<>();
        for (Hotel h : hotelRepository.findByActiveTrueOrderByPricePerNightAsc()) {
            if (!usable(h.isActive(), h.getSupplier())) {
                continue;
            }
            int free = freeRooms(h, start, endExclusive);
            boolean ok = free >= rooms;
            boolean local = wanted.contains(h.getCity().toLowerCase(Locale.ROOT));
            ResourceOption opt = new ResourceOption(h.getId(), ResourceType.HOTEL, h.getName(),
                    h.getCity() + " · " + h.getStarRating() + "★ · " + free + " room(s) free",
                    h.getPricePerNight(), free, ok, !local, ok ? null : "Not enough rooms for these dates",
                    h.getImageUrl(), h.getCity(), h.getStarRating());
            (local ? inArea : elsewhere).add(opt);
        }
        // 3a: when no hotel in the tour area is free, show alternatives from other towns
        boolean anyLocal = inArea.stream().anyMatch(ResourceOption::available);
        if (!anyLocal) {
            inArea.addAll(elsewhere.stream().filter(ResourceOption::available).toList());
        }
        inArea.sort(Comparator.comparing(ResourceOption::available).reversed()
                .thenComparing(ResourceOption::alternative)
                .thenComparing(ResourceOption::price));
        return inArea;
    }

    // ------------------------------------------------------------------ vehicles and guides

    public List<String> vehicleConflicts(Vehicle v, LocalDate start, LocalDate end, Long ignoreBookingId) {
        List<String> problems = new ArrayList<>();
        if (!usable(v.isActive(), v.getSupplier())) {
            problems.add(v.label() + " is inactive or its supplier has been removed");
            return problems;
        }
        problems.addAll(dayConflicts(ResourceType.VEHICLE, v.getId(), v.getModel(), start, end, ignoreBookingId));
        return problems;
    }

    public List<String> guideConflicts(TourGuide g, LocalDate start, LocalDate end, Long ignoreBookingId) {
        List<String> problems = new ArrayList<>();
        if (!usable(g.isActive(), g.getSupplier())) {
            problems.add(g.getFullName() + " is not active");
            return problems;
        }
        problems.addAll(dayConflicts(ResourceType.GUIDE, g.getId(), g.getFullName(), start, end, ignoreBookingId));
        return problems;
    }

    public List<ResourceOption> vehicleOptions(int minSeats, LocalDate start, LocalDate end, Long ignoreBookingId) {
        List<ResourceOption> list = new ArrayList<>();
        for (Vehicle v : vehicleRepository.findByActiveTrueOrderBySeatsAscPricePerDayAsc()) {
            if (!usable(v.isActive(), v.getSupplier())) {
                continue;
            }
            boolean bigEnough = v.getSeats() >= minSeats;
            List<String> conflicts = dayConflicts(ResourceType.VEHICLE, v.getId(), v.getModel(), start, end, ignoreBookingId);
            boolean ok = bigEnough && conflicts.isEmpty();
            String reason = !bigEnough ? "Only " + v.getSeats() + " seats" : (conflicts.isEmpty() ? null : "Already booked on these dates");
            list.add(new ResourceOption(v.getId(), ResourceType.VEHICLE, v.label(),
                    (v.isAirConditioned() ? "A/C · " : "") + "Driver: " + Objects.toString(v.getDriverName(), "assigned later"),
                    v.getPricePerDay(), v.getSeats(), ok, false, reason, null, null, 0));
        }
        list.sort(Comparator.comparing(ResourceOption::available).reversed().thenComparing(ResourceOption::price));
        return list;
    }

    public List<ResourceOption> guideOptions(String language, LocalDate start, LocalDate end, Long ignoreBookingId) {
        String lang = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        List<ResourceOption> list = new ArrayList<>();
        for (TourGuide g : guideRepository.findByActiveTrueOrderByPricePerDayAsc()) {
            if (!usable(g.isActive(), g.getSupplier())) {
                continue;
            }
            boolean speaks = lang.isEmpty() || g.getLanguages().toLowerCase(Locale.ROOT).contains(lang);
            boolean free = dayConflicts(ResourceType.GUIDE, g.getId(), g.getFullName(), start, end, ignoreBookingId).isEmpty();
            list.add(new ResourceOption(g.getId(), ResourceType.GUIDE, g.getFullName(),
                    g.getLanguages() + " · " + g.getExperienceYears() + " yrs · " + Objects.toString(g.getSpecialization(), ""),
                    g.getPricePerDay(), 1, free, !speaks, free ? null : "Already assigned on these dates",
                    null, null, 0));
        }
        list.sort(Comparator.comparing(ResourceOption::available).reversed()
                .thenComparing(ResourceOption::alternative)
                .thenComparing(ResourceOption::price));
        return list;
    }

    /** Cheapest available guide for the dates, used for quoting before a guide is assigned. */
    public Optional<TourGuide> cheapestAvailableGuide(String language, LocalDate start, LocalDate end) {
        String lang = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        List<TourGuide> free = guideRepository.findByActiveTrueOrderByPricePerDayAsc().stream()
                .filter(g -> usable(g.isActive(), g.getSupplier()))
                .filter(g -> dayConflicts(ResourceType.GUIDE, g.getId(), g.getFullName(), start, end, null).isEmpty())
                .toList();
        return free.stream()
                .filter(g -> lang.isEmpty() || g.getLanguages().toLowerCase(Locale.ROOT).contains(lang))
                .findFirst()
                .or(() -> free.stream().findFirst());
    }

    // ------------------------------------------------------------------ helpers

    private List<String> dayConflicts(ResourceType type, Long id, String name, LocalDate start, LocalDate end, Long ignoreBookingId) {
        List<String> problems = new ArrayList<>();
        allocationRepository.findOverlapping(type, id, start, end, ResourceAllocation.Status.ALLOCATED).stream()
                .filter(a -> ignoreBookingId == null || !a.getBooking().getId().equals(ignoreBookingId))
                .forEach(a -> problems.add(name + " is allocated to booking " + a.getBooking().getReference()
                        + " (" + DAY.format(a.getStartDate()) + " - " + DAY.format(a.getEndDate()) + ")"));
        blockedDateRepository.findByResourceTypeAndResourceIdAndDateBetweenOrderByDateAsc(type, id, start, end)
                .forEach(b -> problems.add(name + " is unavailable on " + DAY.format(b.getDate())
                        + (b.getReason() == null ? "" : " (" + b.getReason() + ")")));
        return problems;
    }

    /** Inactive resources and resources of removed suppliers are never offered (PBI-23). */
    static boolean usable(boolean active, Supplier supplier) {
        return active && (supplier == null || supplier.getStatus() == Supplier.Status.ACTIVE);
    }
}
