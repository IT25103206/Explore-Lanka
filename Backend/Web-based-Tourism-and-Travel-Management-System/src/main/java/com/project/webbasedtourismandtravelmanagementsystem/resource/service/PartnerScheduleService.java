package com.project.webbasedtourismandtravelmanagementsystem.resource.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Itinerary;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.ItineraryItem;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.ItineraryRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.Assignment;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.BlockDatesRequest;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.BlockedDateResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.CalendarDay;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.GuideResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.HotelResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.ScheduleUpdateRequest;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.VehicleRequest;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.VehicleResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.WaypointRequest;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Hotel;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.HotelAvailability;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceAllocation;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceBlockedDate;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.TourGuide;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Vehicle;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.HotelAvailabilityRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.HotelRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.ResourceAllocationRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.ResourceBlockedDateRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.TourGuideRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.VehicleRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PartnerScheduleService {

    private final CurrentUser currentUser;

    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;

    private final VehicleRepository vehicleRepository;

    private final TourGuideRepository guideRepository;

    private final ResourceAllocationRepository allocationRepository;
    private final ResourceBlockedDateRepository blockedDateRepository;

    private final BookingRepository bookingRepository;
    private final ItineraryRepository itineraryRepository;

    private final SupplierRepository supplierRepository;


    public PartnerScheduleService(
            CurrentUser currentUser,
            HotelRepository hotelRepository,
            HotelAvailabilityRepository hotelAvailabilityRepository,
            VehicleRepository vehicleRepository,
            TourGuideRepository guideRepository,
            ResourceAllocationRepository allocationRepository,
            ResourceBlockedDateRepository blockedDateRepository,
            BookingRepository bookingRepository,
            ItineraryRepository itineraryRepository,
            SupplierRepository supplierRepository) {

        this.currentUser = currentUser;

        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository =
                hotelAvailabilityRepository;

        this.vehicleRepository = vehicleRepository;

        this.guideRepository = guideRepository;

        this.allocationRepository =
                allocationRepository;

        this.blockedDateRepository =
                blockedDateRepository;

        this.bookingRepository =
                bookingRepository;

        this.itineraryRepository =
                itineraryRepository;

        this.supplierRepository =
                supplierRepository;
    }


    // =========================================================
    // HOTEL PARTNER
    // =========================================================

    @Transactional(readOnly = true)
    public List<HotelResponse> myHotels() {

        requireRole(
                Role.HOTEL_PARTNER
        );

        /*
         * Current User entity does not have a Supplier field.
         * Therefore supplier ownership cannot be resolved from
         * the logged-in user yet.
         */
        return hotelRepository
                .findAllByOrderByCityAscNameAsc()
                .stream()
                .map(
                        HotelResponse::from
                )
                .toList();
    }


    // =========================================================
    // HOTEL CALENDAR
    // =========================================================

    @Transactional(readOnly = true)
    public List<CalendarDay> hotelCalendar(
            Long hotelId,
            LocalDate from,
            LocalDate to) {

        requireRole(
                Role.HOTEL_PARTNER
        );

        Hotel hotel =
                findHotel(
                        hotelId
                );

        validateRange(
                from,
                to
        );


        Map<LocalDate, HotelAvailability> rows =
                new HashMap<>();


        hotelAvailabilityRepository
                .findByHotelIdAndDateBetweenOrderByDateAsc(
                        hotelId,
                        from,
                        to
                )
                .forEach(row ->
                        rows.put(
                                row.getDate(),
                                row
                        )
                );


        List<ResourceAllocation> allocations =
                allocationRepository
                        .findOverlapping(
                                ResourceType.HOTEL,
                                hotelId,
                                from,
                                to,
                                ResourceAllocation.Status.ALLOCATED
                        );


        List<CalendarDay> result =
                new ArrayList<>();


        for (
                LocalDate date = from;
                !date.isAfter(to);
                date = date.plusDays(1)
        ) {

            HotelAvailability row =
                    rows.get(
                            date
                    );


            int capacity =
                    row == null
                            ? hotel.getTotalRooms()
                            : row.getAvailableRooms();


            int booked =
                    row == null
                            ? 0
                            : row.getBookedRooms();


            final LocalDate currentDate =
                    date;


            List<String> references =
                    allocations.stream()

                            .filter(allocation ->
                                    !currentDate.isBefore(
                                            allocation.getStartDate()
                                    )
                                            && currentDate.isBefore(
                                            allocation.getEndDate()
                                    )
                            )

                            .map(allocation ->
                                    bookingReference(
                                            allocation.getBooking()
                                    )
                            )

                            .toList();


            result.add(
                    new CalendarDay(
                            date,
                            capacity,
                            booked,
                            Math.max(
                                    0,
                                    capacity - booked
                            ),
                            references
                    )
            );
        }


        return result;
    }


    // =========================================================
    // UPDATE HOTEL SCHEDULE
    // =========================================================

    public List<CalendarDay> updateHotelSchedule(
            Long hotelId,
            ScheduleUpdateRequest request) {

        requireRole(
                Role.HOTEL_PARTNER
        );

        Hotel hotel =
                findHotel(
                        hotelId
                );


        validateRange(
                request.startDate(),
                request.endDate()
        );


        Map<LocalDate, HotelAvailability> existing =
                new HashMap<>();


        hotelAvailabilityRepository
                .findByHotelIdAndDateBetweenOrderByDateAsc(
                        hotelId,
                        request.startDate(),
                        request.endDate()
                )
                .forEach(row ->
                        existing.put(
                                row.getDate(),
                                row
                        )
                );


        for (
                LocalDate date =
                request.startDate();

                !date.isAfter(
                        request.endDate()
                );

                date =
                        date.plusDays(1)
        ) {

            HotelAvailability row =
                    existing.get(
                            date
                    );


            if (row == null) {

                row =
                        new HotelAvailability(
                                hotel,
                                date
                        );
            }


            if (request.availableRooms()
                    < row.getBookedRooms()) {

                throw new BusinessException(
                        "Available rooms cannot be less than "
                                + row.getBookedRooms()
                                + " because rooms are already booked on "
                                + date
                );
            }


            row.setAvailableRooms(
                    request.availableRooms()
            );


            hotelAvailabilityRepository.save(
                    row
            );
        }


        return hotelCalendar(
                hotelId,
                request.startDate(),
                request.endDate()
        );
    }


    // =========================================================
    // VEHICLES
    // =========================================================

    @Transactional(readOnly = true)
    public List<VehicleResponse> myVehicles() {

        requireRole(
                Role.TRANSPORT_PROVIDER
        );


        return vehicleRepository
                .findAllByOrderBySeatsAscModelAsc()
                .stream()
                .map(
                        VehicleResponse::from
                )
                .toList();
    }


    // =========================================================
    // SAVE / UPDATE VEHICLE
    // =========================================================

    public VehicleResponse saveMyVehicle(
            Long id,
            VehicleRequest request) {

        requireRole(
                Role.TRANSPORT_PROVIDER
        );


        Vehicle vehicle;


        if (id == null) {

            vehicle =
                    new Vehicle();

        } else {

            vehicle =
                    vehicleRepository
                            .findById(id)
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Vehicle",
                                            id
                                    )
                            );
        }


        if (request.supplierId()
                != null) {

            Supplier supplier =
                    supplierRepository
                            .findById(
                                    request.supplierId()
                            )
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Supplier",
                                            request.supplierId()
                                    )
                            );


            vehicle.setSupplier(
                    supplier
            );
        }


        vehicle.setType(
                request.type()
        );

        vehicle.setModel(
                request.model()
        );

        vehicle.setRegistrationNo(
                request.registrationNo()
        );

        vehicle.setSeats(
                request.seats()
        );

        vehicle.setPricePerDay(
                request.pricePerDay()
        );

        vehicle.setDriverName(
                request.driverName()
        );

        vehicle.setAirConditioned(
                request.airConditioned()
        );

        vehicle.setActive(
                request.active()
        );


        Vehicle saved =
                vehicleRepository.save(
                        vehicle
                );


        return VehicleResponse.from(
                saved
        );
    }


    // =========================================================
    // BLOCKED DATES
    // =========================================================

    @Transactional(readOnly = true)
    public List<BlockedDateResponse> blockedDates(
            ResourceType type,
            Long id) {

        checkResourceExists(
                type,
                id
        );


        return blockedDateRepository
                .findByResourceTypeAndResourceIdAndDateGreaterThanEqualOrderByDateAsc(
                        type,
                        id,
                        LocalDate.now()
                )
                .stream()
                .map(
                        BlockedDateResponse::from
                )
                .toList();
    }


    // =========================================================
    // BLOCK RESOURCE DATES
    // =========================================================

    public List<BlockedDateResponse> block(
            ResourceType type,
            Long id,
            BlockDatesRequest request) {

        checkResourceExists(
                type,
                id
        );


        validateRange(
                request.startDate(),
                request.endDate()
        );


        for (
                LocalDate date =
                request.startDate();

                !date.isAfter(
                        request.endDate()
                );

                date =
                        date.plusDays(1)
        ) {

            boolean alreadyBlocked =
                    blockedDateRepository
                            .findByResourceTypeAndResourceIdAndDate(
                                    type,
                                    id,
                                    date
                            )
                            .isPresent();


            if (!alreadyBlocked) {

                blockedDateRepository.save(
                        new ResourceBlockedDate(
                                type,
                                id,
                                date,
                                request.reason()
                        )
                );
            }
        }


        return blockedDateRepository
                .findByResourceTypeAndResourceIdAndDateBetweenOrderByDateAsc(
                        type,
                        id,
                        request.startDate(),
                        request.endDate()
                )
                .stream()
                .map(
                        BlockedDateResponse::from
                )
                .toList();
    }


    // =========================================================
    // UNBLOCK DATE
    // =========================================================

    public void unblock(
            ResourceType type,
            Long id,
            Long blockedDateId) {

        checkResourceExists(
                type,
                id
        );


        ResourceBlockedDate blocked =
                blockedDateRepository
                        .findById(
                                blockedDateId
                        )
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Blocked date",
                                        blockedDateId
                                )
                        );


        if (blocked.getResourceType()
                != type
                || !blocked.getResourceId()
                .equals(id)) {

            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "This blocked date does not belong to this resource"
            );
        }


        blockedDateRepository.delete(
                blocked
        );
    }


    // =========================================================
    // GUIDE PROFILE
    // =========================================================

    @Transactional(readOnly = true)
    public GuideResponse myGuideProfile() {

        return GuideResponse.from(
                myGuide()
        );
    }


    // =========================================================
    // ADD WAYPOINT
    // =========================================================

    public void addWaypoint(
            Long bookingId,
            WaypointRequest request) {

        TourGuide guide =
                myGuide();


        boolean assigned =
                allocationRepository
                        .findByBookingIdAndStatus(
                                bookingId,
                                ResourceAllocation.Status.ALLOCATED
                        )
                        .stream()

                        .anyMatch(allocation ->
                                allocation.getResourceType()
                                        == ResourceType.GUIDE
                                        && allocation
                                        .getResourceId()
                                        .equals(
                                                guide.getId()
                                        )
                        );


        if (!assigned) {

            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "You can only add waypoints to tours assigned to you"
            );
        }


        Booking booking =
                bookingRepository
                        .findById(
                                bookingId
                        )
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Booking",
                                        bookingId
                                )
                        );


        if (booking.getTravelDate()
                == null) {

            throw new BusinessException(
                    "Booking does not have a travel date"
            );
        }


        Itinerary itinerary =
                itineraryRepository
                        .findByBookingId(
                                bookingId
                        )
                        .orElseThrow(() ->
                                new BusinessException(
                                        "The itinerary for this booking has not been generated yet"
                                )
                        );


        LocalDate waypointDate =
                booking
                        .getTravelDate()
                        .plusDays(
                                request.dayNumber() - 1L
                        );


        itinerary.addItem(
                new ItineraryItem(

                        request.dayNumber(),

                        waypointDate,

                        ItineraryItem.Type.WAYPOINT,

                        request.title().trim(),

                        request.description(),

                        request.location(),

                        request.route(),

                        guide.getFullName()
                )
        );


        itineraryRepository.save(
                itinerary
        );
    }


    // =========================================================
    // ASSIGNMENTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<Assignment> myAssignments() {

        Role role =
                currentUser.role();


        ResourceType resourceType;

        List<Long> resourceIds;


        switch (role) {

            case HOTEL_PARTNER -> {

                resourceType =
                        ResourceType.HOTEL;

                resourceIds =
                        hotelRepository
                                .findAll()
                                .stream()
                                .map(
                                        Hotel::getId
                                )
                                .toList();
            }


            case TRANSPORT_PROVIDER -> {

                resourceType =
                        ResourceType.VEHICLE;

                resourceIds =
                        vehicleRepository
                                .findAll()
                                .stream()
                                .map(
                                        Vehicle::getId
                                )
                                .toList();
            }


            case TOUR_GUIDE -> {

                resourceType =
                        ResourceType.GUIDE;

                resourceIds =
                        List.of(
                                myGuide()
                                        .getId()
                        );
            }


            default ->

                    throw new BusinessException(
                            HttpStatus.FORBIDDEN,
                            "Only logistic partners have assignments"
                    );
        }


        if (resourceIds.isEmpty()) {

            return List.of();
        }


        return allocationRepository
                .findByResourceTypeAndResourceIdInAndStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(

                        resourceType,

                        resourceIds,

                        ResourceAllocation.Status.ALLOCATED,

                        LocalDate.now()
                                .minusDays(1)
                )

                .stream()

                .map(allocation -> {

                    Booking booking =
                            allocation.getBooking();


                    String customerName =
                            customerName(
                                    booking
                            );


                    return new Assignment(

                            allocation.getId(),

                            booking.getBookingId(),

                            bookingReference(
                                    booking
                            ),

                            booking.getTourPackage()
                                    == null
                                    ? "Tour"
                                    : booking
                                    .getTourPackage()
                                    .getName(),

                            allocation.getResourceName(),

                            allocation.getResourceType(),

                            allocation.getStartDate(),

                            allocation.getEndDate(),

                            allocation.getQuantity(),

                            booking.getNumberOfPeople()
                                    == null
                                    ? 0
                                    : booking
                                    .getNumberOfPeople(),

                            customerName,

                            booking.getCustomer()
                                    == null
                                    ? null
                                    : booking
                                    .getCustomer()
                                    .getPhone(),

                            booking.getSpecialRequests(),

                            null
                    );
                })

                .toList();
    }


    // =========================================================
    // CURRENT GUIDE
    // =========================================================

    private TourGuide myGuide() {

        requireRole(
                Role.TOUR_GUIDE
        );


        return guideRepository
                .findByUserId(
                        currentUser.id()
                )
                .orElseThrow(() ->
                        new BusinessException(
                                "Your account is not linked to a tour guide profile yet."
                        )
                );
    }


    // =========================================================
    // ROLE CHECK
    // =========================================================

    private void requireRole(
            Role requiredRole) {

        Role actualRole =
                currentUser.role();


        if (actualRole
                != requiredRole) {

            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "This section is for "
                            + requiredRole.getDisplayName()
                            + " accounts"
            );
        }
    }


    // =========================================================
    // RESOURCE EXISTS
    // =========================================================

    private void checkResourceExists(
            ResourceType type,
            Long id) {

        switch (type) {

            case HOTEL ->

                    findHotel(
                            id
                    );


            case VEHICLE ->

                    vehicleRepository
                            .findById(id)
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Vehicle",
                                            id
                                    )
                            );


            case GUIDE ->

                    guideRepository
                            .findById(id)
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Tour guide",
                                            id
                                    )
                            );
        }
    }


    // =========================================================
    // FIND HOTEL
    // =========================================================

    private Hotel findHotel(
            Long id) {

        return hotelRepository
                .findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Hotel",
                                id
                        )
                );
    }


    // =========================================================
    // DATE VALIDATION
    // =========================================================

    private void validateRange(
            LocalDate from,
            LocalDate to) {

        if (from == null) {

            throw new BusinessException(
                    "Start date is required"
            );
        }


        if (to == null) {

            throw new BusinessException(
                    "End date is required"
            );
        }


        if (to.isBefore(from)) {

            throw new BusinessException(
                    "End date cannot be before start date"
            );
        }
    }


    // =========================================================
    // BOOKING REFERENCE
    // =========================================================

    private String bookingReference(
            Booking booking) {

        if (booking == null
                || booking.getBookingId()
                == null) {

            return "BOOKING";
        }


        return "BOOK-"
                + booking.getBookingId();
    }


    // =========================================================
    // CUSTOMER NAME
    // =========================================================

    private String customerName(
            Booking booking) {

        if (booking == null
                || booking.getCustomer()
                == null) {

            return "Customer";
        }


        User customer =
                booking.getCustomer();


        if (customer.getName()
                != null
                && !customer
                .getName()
                .isBlank()) {

            return customer.getName();
        }


        if (customer.getUsername()
                != null
                && !customer
                .getUsername()
                .isBlank()) {

            return customer.getUsername();
        }


        if (customer.getEmail()
                != null) {

            return customer.getEmail();
        }


        return "Customer";
    }
}