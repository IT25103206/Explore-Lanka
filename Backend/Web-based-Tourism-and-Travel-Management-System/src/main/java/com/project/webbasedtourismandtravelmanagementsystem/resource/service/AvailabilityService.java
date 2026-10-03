package com.project.webbasedtourismandtravelmanagementsystem.resource.service;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.ResourceOption;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Hotel;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.HotelAvailability;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceAllocation;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.TourGuide;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Vehicle;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.HotelAvailabilityRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.HotelRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.ResourceAllocationRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.TourGuideRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.VehicleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class AvailabilityService {

    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final ResourceAllocationRepository allocationRepository;


    public AvailabilityService(
            HotelRepository hotelRepository,
            HotelAvailabilityRepository hotelAvailabilityRepository,
            VehicleRepository vehicleRepository,
            TourGuideRepository guideRepository,
            ResourceAllocationRepository allocationRepository) {

        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository = hotelAvailabilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.allocationRepository = allocationRepository;
    }


    // =========================================================
    // HOTEL OPTIONS
    // =========================================================

    public List<ResourceOption> hotelOptions(
            List<String> destinations,
            LocalDate startDate,
            LocalDate endDate,
            int requiredRooms) {

        if (startDate == null) {
            return List.of();
        }

        LocalDate effectiveEnd =
                endDate == null
                        || !endDate.isAfter(startDate)
                        ? startDate.plusDays(1)
                        : endDate;

        int roomsNeeded =
                Math.max(1, requiredRooms);

        List<ResourceOption> result =
                new ArrayList<>();

        for (Hotel hotel : hotelRepository.findAll()) {

            if (!hotel.isActive()) {
                continue;
            }

            List<String> conflicts =
                    hotelConflicts(
                            hotel,
                            startDate,
                            effectiveEnd,
                            roomsNeeded
                    );

            boolean available =
                    conflicts.isEmpty();

            boolean alternative =
                    false;

            if (destinations != null
                    && !destinations.isEmpty()
                    && hotel.getCity() != null) {

                boolean cityMatches =
                        destinations.stream()
                                .anyMatch(destination ->
                                        destination != null
                                                && destination
                                                .trim()
                                                .equalsIgnoreCase(
                                                        hotel.getCity().trim()
                                                )
                                );

                alternative = !cityMatches;
            }

            String reason =
                    available
                            ? null
                            : String.join(
                            "; ",
                            conflicts
                    );

            result.add(
                    new ResourceOption(
                            hotel.getId(),
                            ResourceType.HOTEL,
                            hotel.getName(),

                            hotel.getCity() == null
                                    ? "Hotel"
                                    : hotel.getCity(),

                            hotel.getPricePerNight(),

                            hotel.getTotalRooms(),

                            available,

                            alternative,

                            reason,

                            hotel.getImageUrl(),

                            hotel.getCity(),

                            hotel.getStarRating()
                    )
            );
        }

        return result;
    }


    // =========================================================
    // VEHICLE OPTIONS
    // =========================================================

    public List<ResourceOption> vehicleOptions(
            int requiredSeats,
            LocalDate startDate,
            LocalDate endDate,
            Long excludeBookingId) {

        if (startDate == null) {
            return List.of();
        }

        LocalDate effectiveEnd =
                endDate == null
                        ? startDate
                        : endDate;

        int seatsNeeded =
                Math.max(
                        1,
                        requiredSeats
                );

        List<ResourceOption> result =
                new ArrayList<>();

        for (Vehicle vehicle :
                vehicleRepository.findAll()) {

            if (!vehicle.isActive()) {
                continue;
            }

            List<String> conflicts =
                    vehicleConflicts(
                            vehicle,
                            startDate,
                            effectiveEnd,
                            excludeBookingId
                    );

            boolean enoughSeats =
                    vehicle.getSeats()
                            >= seatsNeeded;

            boolean available =
                    enoughSeats
                            && conflicts.isEmpty();

            String reason = null;

            if (!enoughSeats) {

                reason =
                        "Only "
                                + vehicle.getSeats()
                                + " seat(s) available";

            } else if (!conflicts.isEmpty()) {

                reason =
                        String.join(
                                "; ",
                                conflicts
                        );
            }

            result.add(
                    new ResourceOption(
                            vehicle.getId(),
                            ResourceType.VEHICLE,
                            vehicle.label(),

                            vehicle.getRegistrationNo(),

                            vehicle.getPricePerDay(),

                            vehicle.getSeats(),

                            available,

                            false,

                            reason,

                            null,

                            null,

                            0
                    )
            );
        }

        return result;
    }


    // =========================================================
    // GUIDE OPTIONS
    // =========================================================

    public List<ResourceOption> guideOptions(
            String language,
            LocalDate startDate,
            LocalDate endDate,
            Long excludeBookingId) {

        if (startDate == null) {
            return List.of();
        }

        LocalDate effectiveEnd =
                endDate == null
                        ? startDate
                        : endDate;

        List<ResourceOption> result =
                new ArrayList<>();

        for (TourGuide guide :
                guideRepository.findAll()) {

            if (!guide.isActive()) {
                continue;
            }

            List<String> conflicts =
                    guideConflicts(
                            guide,
                            startDate,
                            effectiveEnd,
                            excludeBookingId
                    );

            boolean languageMatch =
                    language == null
                            || language.isBlank()
                            || (
                            guide.getLanguages() != null
                                    && guide
                                    .getLanguages()
                                    .toLowerCase()
                                    .contains(
                                            language
                                                    .trim()
                                                    .toLowerCase()
                                    )
                    );

            boolean available =
                    languageMatch
                            && conflicts.isEmpty();

            String reason = null;

            if (!languageMatch) {

                reason =
                        "Requested language is not available";

            } else if (!conflicts.isEmpty()) {

                reason =
                        String.join(
                                "; ",
                                conflicts
                        );
            }

            result.add(
                    new ResourceOption(
                            guide.getId(),
                            ResourceType.GUIDE,
                            guide.getFullName(),

                            guide.getLanguages(),

                            guide.getPricePerDay(),

                            1,

                            available,

                            false,

                            reason,

                            null,

                            null,

                            0
                    )
            );
        }

        return result;
    }


    // =========================================================
    // HOTEL CONFLICTS
    // =========================================================

    public List<String> hotelConflicts(
            Hotel hotel,
            LocalDate startDate,
            LocalDate endDate,
            int requiredRooms) {

        List<String> conflicts =
                new ArrayList<>();

        if (hotel == null) {

            conflicts.add(
                    "Hotel is not available"
            );

            return conflicts;
        }

        if (!hotel.isActive()) {

            conflicts.add(
                    "Hotel is inactive"
            );

            return conflicts;
        }

        if (startDate == null) {

            conflicts.add(
                    "Travel date is required"
            );

            return conflicts;
        }

        LocalDate effectiveEnd =
                endDate == null
                        || !endDate.isAfter(startDate)
                        ? startDate.plusDays(1)
                        : endDate;

        int roomsNeeded =
                Math.max(
                        1,
                        requiredRooms
                );

        for (
                LocalDate date = startDate;
                date.isBefore(effectiveEnd);
                date = date.plusDays(1)
        ) {

            Optional<HotelAvailability> availability =
                    hotelAvailabilityRepository
                            .findByHotelIdAndDate(
                                    hotel.getId(),
                                    date
                            );

            int totalRooms =
                    hotel.getTotalRooms();

            int bookedRooms =
                    availability
                            .map(
                                    HotelAvailability::getBookedRooms
                            )
                            .orElse(0);

            /*
             * If a separate available-room value exists,
             * the availability table can later be used
             * directly. For the current model use
             * totalRooms - bookedRooms.
             */

            int freeRooms =
                    Math.max(
                            0,
                            totalRooms - bookedRooms
                    );

            if (freeRooms < roomsNeeded) {

                conflicts.add(
                        "Only "
                                + freeRooms
                                + " room(s) available on "
                                + date
                );
            }
        }

        return conflicts;
    }


    // =========================================================
    // VEHICLE CONFLICTS
    // =========================================================

    public List<String> vehicleConflicts(
            Vehicle vehicle,
            LocalDate startDate,
            LocalDate endDate,
            Long excludeBookingId) {

        List<String> conflicts =
                new ArrayList<>();

        if (vehicle == null) {

            conflicts.add(
                    "Vehicle is not available"
            );

            return conflicts;
        }

        if (!vehicle.isActive()) {

            conflicts.add(
                    "Vehicle is inactive"
            );

            return conflicts;
        }

        if (startDate == null) {

            conflicts.add(
                    "Travel date is required"
            );

            return conflicts;
        }

        LocalDate effectiveEnd =
                endDate == null
                        ? startDate
                        : endDate;

        for (ResourceAllocation allocation :
                allocationRepository.findAll()) {

            if (allocation.getStatus()
                    != ResourceAllocation.Status.ALLOCATED) {

                continue;
            }

            if (allocation.getResourceType()
                    != ResourceType.VEHICLE) {

                continue;
            }

            if (allocation.getResourceId() == null
                    || vehicle.getId() == null
                    || !allocation
                    .getResourceId()
                    .equals(
                            vehicle.getId()
                    )) {

                continue;
            }

            Booking existingBooking =
                    allocation.getBooking();

            /*
             * FIX:
             * Booking uses getBookingId(), not getId().
             */
            if (existingBooking != null
                    && excludeBookingId != null
                    && existingBooking.getBookingId() != null
                    && existingBooking
                    .getBookingId()
                    .equals(excludeBookingId)) {

                continue;
            }

            if (overlaps(
                    startDate,
                    effectiveEnd,
                    allocation.getStartDate(),
                    allocation.getEndDate()
            )) {

                conflicts.add(
                        "Already allocated to "
                                + bookingReference(
                                existingBooking
                        )
                );
            }
        }

        return conflicts;
    }


    // =========================================================
    // GUIDE CONFLICTS
    // =========================================================

    public List<String> guideConflicts(
            TourGuide guide,
            LocalDate startDate,
            LocalDate endDate,
            Long excludeBookingId) {

        List<String> conflicts =
                new ArrayList<>();

        if (guide == null) {

            conflicts.add(
                    "Tour guide is not available"
            );

            return conflicts;
        }

        if (!guide.isActive()) {

            conflicts.add(
                    "Tour guide is inactive"
            );

            return conflicts;
        }

        if (startDate == null) {

            conflicts.add(
                    "Travel date is required"
            );

            return conflicts;
        }

        LocalDate effectiveEnd =
                endDate == null
                        ? startDate
                        : endDate;

        for (ResourceAllocation allocation :
                allocationRepository.findAll()) {

            if (allocation.getStatus()
                    != ResourceAllocation.Status.ALLOCATED) {

                continue;
            }

            if (allocation.getResourceType()
                    != ResourceType.GUIDE) {

                continue;
            }

            if (allocation.getResourceId() == null
                    || guide.getId() == null
                    || !allocation
                    .getResourceId()
                    .equals(
                            guide.getId()
                    )) {

                continue;
            }

            Booking existingBooking =
                    allocation.getBooking();

            /*
             * FIX:
             * Booking has getBookingId(), not getId().
             */
            if (existingBooking != null
                    && excludeBookingId != null
                    && existingBooking.getBookingId() != null
                    && existingBooking
                    .getBookingId()
                    .equals(excludeBookingId)) {

                continue;
            }

            if (overlaps(
                    startDate,
                    effectiveEnd,
                    allocation.getStartDate(),
                    allocation.getEndDate()
            )) {

                conflicts.add(
                        "Already assigned to "
                                + bookingReference(
                                existingBooking
                        )
                );
            }
        }

        return conflicts;
    }


    // =========================================================
    // CHEAPEST AVAILABLE GUIDE
    // =========================================================

    public Optional<TourGuide> cheapestAvailableGuide(
            String language,
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null) {
            return Optional.empty();
        }

        LocalDate effectiveEnd =
                endDate == null
                        ? startDate
                        : endDate;

        return guideRepository
                .findAll()
                .stream()

                .filter(
                        TourGuide::isActive
                )

                .filter(guide ->

                        language == null
                                || language.isBlank()
                                || (
                                guide.getLanguages() != null
                                        && guide
                                        .getLanguages()
                                        .toLowerCase()
                                        .contains(
                                                language
                                                        .trim()
                                                        .toLowerCase()
                                        )
                        )
                )

                .filter(guide ->
                        guideConflicts(
                                guide,
                                startDate,
                                effectiveEnd,
                                null
                        ).isEmpty()
                )

                .min((first, second) -> {

                    BigDecimal firstPrice =
                            first.getPricePerDay() == null
                                    ? BigDecimal.ZERO
                                    : first.getPricePerDay();

                    BigDecimal secondPrice =
                            second.getPricePerDay() == null
                                    ? BigDecimal.ZERO
                                    : second.getPricePerDay();

                    return firstPrice.compareTo(
                            secondPrice
                    );
                });
    }


    // =========================================================
    // DATE OVERLAP
    // =========================================================

    private boolean overlaps(
            LocalDate requestedStart,
            LocalDate requestedEnd,
            LocalDate existingStart,
            LocalDate existingEnd) {

        if (requestedStart == null
                || existingStart == null) {

            return false;
        }

        LocalDate rEnd =
                requestedEnd == null
                        ? requestedStart
                        : requestedEnd;

        LocalDate eEnd =
                existingEnd == null
                        ? existingStart
                        : existingEnd;

        /*
         * Inclusive date overlap.
         */
        return !rEnd.isBefore(existingStart)
                && !eEnd.isBefore(requestedStart);
    }


    // =========================================================
    // BOOKING REFERENCE
    // =========================================================

    private String bookingReference(
            Booking booking) {

        if (booking == null
                || booking.getBookingId() == null) {

            return "BOOKING";
        }

        /*
         * FIX:
         * Current Booking does not have getReference().
         */
        return "BOOK-"
                + booking.getBookingId();
    }
}