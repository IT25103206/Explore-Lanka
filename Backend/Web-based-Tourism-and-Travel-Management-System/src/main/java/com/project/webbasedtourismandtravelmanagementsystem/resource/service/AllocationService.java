package com.project.webbasedtourismandtravelmanagementsystem.resource.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.AllocateRequest;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.AllocationResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.AllocationView;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.PendingAllocation;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class AllocationService {

    private static final DateTimeFormatter DAY =
            DateTimeFormatter.ofPattern("dd MMM");

    private final BookingRepository bookingRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final AvailabilityService availability;
    private final NotificationService notificationService;

    public AllocationService(
            BookingRepository bookingRepository,
            ResourceAllocationRepository allocationRepository,
            HotelRepository hotelRepository,
            HotelAvailabilityRepository hotelAvailabilityRepository,
            VehicleRepository vehicleRepository,
            TourGuideRepository guideRepository,
            AvailabilityService availability,
            NotificationService notificationService) {

        this.bookingRepository = bookingRepository;
        this.allocationRepository = allocationRepository;
        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository = hotelAvailabilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.availability = availability;
        this.notificationService = notificationService;
    }


    // =========================================================
    // VIEW ALLOCATION
    // =========================================================

    @Transactional(readOnly = true)
    public AllocationView view(Long bookingId) {

        Booking booking = booking(bookingId);

        LocalDate travelDate = booking.getTravelDate();

        int travellers =
                booking.getNumberOfPeople() == null
                        ? 1
                        : booking.getNumberOfPeople();

        List<String> warnings =
                new ArrayList<>();

        /*
         * Current Booking model does not contain:
         *
         * startDate
         * endDate
         * rooms
         * guideRequired
         * guideLanguage
         * preferredHotel
         * preferredVehicle
         *
         * Therefore this booking is currently treated
         * as a single travel-date booking.
         */

        List<ResourceOption> hotels =
                List.of();

        List<ResourceOption> vehicles =
                travelDate == null
                        ? List.of()
                        : availability.vehicleOptions(
                        travellers,
                        travelDate,
                        travelDate,
                        booking.getBookingId()
                );

        List<ResourceOption> guides =
                List.of();

        if (vehicles.stream()
                .noneMatch(ResourceOption::available)) {

            warnings.add(
                    "No vehicle with "
                            + travellers
                            + "+ seats is available for this date."
            );
        }

        if (!isConfirmed(booking)) {

            warnings.add(
                    "Only confirmed bookings can be allocated. "
                            + "Current status: "
                            + booking.getStatus()
            );
        }

        List<AllocationResponse> current =
                allocationRepository
                        .findByBookingIdAndStatus(
                                booking.getBookingId(),
                                ResourceAllocation.Status.ALLOCATED
                        )
                        .stream()
                        .map(AllocationResponse::from)
                        .toList();

        String reference =
                bookingReference(booking);

        String customerName =
                customerName(booking);

        String packageName =
                booking.getTourPackage() == null
                        ? null
                        : booking.getTourPackage().getName();

        return new AllocationView(
                booking.getBookingId(),
                reference,
                customerName,
                packageName,

                // Current Booking model has no destinations list
                List.of(),

                travelDate,
                travelDate,

                // No start/end duration in current Booking model
                0,

                travellers,

                // Current Booking model has no rooms field
                0,

                // Current Booking model has no guideRequired
                false,

                // Current Booking model has no guideLanguage
                null,

                booking.getSpecialRequests(),

                // No preferred hotel
                null,

                // No preferred vehicle
                null,

                current,
                hotels,
                vehicles,
                guides,
                warnings
        );
    }


    // =========================================================
    // MANUAL ALLOCATION
    // =========================================================

    public List<AllocationResponse> allocate(
            Long bookingId,
            AllocateRequest request,
            String actor) {

        Booking booking =
                booking(bookingId);

        if (!isConfirmed(booking)) {

            throw new BusinessException(
                    "Resources can only be allocated "
                            + "to confirmed bookings. Current status: "
                            + booking.getStatus()
            );
        }

        if (booking.getTravelDate() == null) {

            throw new BusinessException(
                    "Travel date is required before resources can be allocated"
            );
        }

        if (booking.getTravelDate()
                .isBefore(LocalDate.now())) {

            throw new BusinessException(
                    "This booking's travel date has already passed"
            );
        }

        if (request == null) {

            throw new BusinessException(
                    "Allocation information is required"
            );
        }

        if (request.hotelId() == null
                && request.vehicleId() == null
                && request.guideId() == null) {

            throw new BusinessException(
                    "Select at least one hotel, vehicle or tour guide"
            );
        }

        List<String> assigned =
                new ArrayList<>();


        // -----------------------------------------------------
        // HOTEL
        // -----------------------------------------------------

        if (request.hotelId() != null) {

            Hotel hotel =
                    hotelRepository
                            .findById(request.hotelId())
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Hotel",
                                            request.hotelId()
                                    )
                            );

            release(
                    booking,
                    ResourceType.HOTEL
            );

            allocateHotel(
                    booking,
                    hotel,
                    actor
            );

            assigned.add(
                    "hotel " + hotel.getName()
            );
        }


        // -----------------------------------------------------
        // VEHICLE
        // -----------------------------------------------------

        if (request.vehicleId() != null) {

            Vehicle vehicle =
                    vehicleRepository
                            .findById(request.vehicleId())
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Vehicle",
                                            request.vehicleId()
                                    )
                            );

            int travellers =
                    travellerCount(booking);

            if (vehicle.getSeats() < travellers) {

                throw new BusinessException(
                        vehicle.label()
                                + " has fewer seats than the "
                                + travellers
                                + " travellers"
                );
            }

            release(
                    booking,
                    ResourceType.VEHICLE
            );

            allocateVehicle(
                    booking,
                    vehicle,
                    actor
            );

            assigned.add(
                    "vehicle " + vehicle.label()
            );
        }


        // -----------------------------------------------------
        // GUIDE
        // -----------------------------------------------------

        if (request.guideId() != null) {

            TourGuide guide =
                    guideRepository
                            .findById(request.guideId())
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Tour guide",
                                            request.guideId()
                                    )
                            );

            release(
                    booking,
                    ResourceType.GUIDE
            );

            allocateGuide(
                    booking,
                    guide,
                    actor
            );

            assigned.add(
                    "guide " + guide.getFullName()
            );
        }


        // -----------------------------------------------------
        // CUSTOMER NOTIFICATION
        // -----------------------------------------------------

        notificationService.notify(
                booking.getCustomer(),
                Notification.Type.ALLOCATION,
                "Your trip resources are confirmed",

                "Booking "
                        + bookingReference(booking)
                        + ": assigned "
                        + String.join(", ", assigned)
                        + ".",

                "/customer/bookings.html"
        );


        return allocationRepository
                .findByBookingIdAndStatus(
                        booking.getBookingId(),
                        ResourceAllocation.Status.ALLOCATED
                )
                .stream()
                .map(AllocationResponse::from)
                .toList();
    }


    // =========================================================
    // AUTO ALLOCATION
    // =========================================================

    public List<String> autoAllocate(
            Booking booking) {

        List<String> problems =
                new ArrayList<>();

        if (booking == null) {

            problems.add(
                    "Booking is not available"
            );

            return problems;
        }

        if (booking.getTravelDate() == null) {

            problems.add(
                    "Travel date has not been selected"
            );

            return problems;
        }

        /*
         * The current Booking model has no:
         *
         * preferredHotel
         * preferredVehicle
         * guideRequired
         * guideLanguage
         *
         * Therefore automatic allocation cannot choose
         * those resources from booking preferences yet.
         */

        problems.add(
                "Automatic resource preferences are not available "
                        + "in the current booking model"
        );

        notificationService.notifyRole(
                Role.LOGISTIC_SUPPLIER_MANAGER,
                Notification.Type.ALLOCATION,

                "Allocation needed for "
                        + bookingReference(booking),

                "Automatic allocation could not complete: "
                        + String.join("; ", problems),

                "/admin/allocations.html?booking="
                        + booking.getBookingId()
        );

        return problems;
    }


    // =========================================================
    // RELEASE EVERYTHING
    // =========================================================

    public void releaseAll(
            Booking booking) {

        if (booking == null) {
            return;
        }

        for (ResourceType type :
                ResourceType.values()) {

            release(
                    booking,
                    type
            );
        }
    }


    // =========================================================
    // CURRENT ALLOCATIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<AllocationResponse> current(
            Long bookingId) {

        return allocationRepository
                .findByBookingIdAndStatus(
                        bookingId,
                        ResourceAllocation.Status.ALLOCATED
                )
                .stream()
                .map(AllocationResponse::from)
                .toList();
    }


    // =========================================================
    // MISSING RESOURCES
    // =========================================================

    @Transactional(readOnly = true)
    public List<String> missing(
            Booking booking) {

        List<ResourceAllocation> current =
                allocationRepository
                        .findByBookingIdAndStatus(
                                booking.getBookingId(),
                                ResourceAllocation.Status.ALLOCATED
                        );

        List<String> missing =
                new ArrayList<>();

        /*
         * Vehicle is considered required for the
         * current simple Booking model.
         */

        boolean hasVehicle =
                current.stream()
                        .anyMatch(allocation ->
                                allocation.getResourceType()
                                        == ResourceType.VEHICLE
                        );

        if (!hasVehicle) {

            missing.add(
                    "Vehicle"
            );
        }

        return missing;
    }


    // =========================================================
    // PENDING ALLOCATIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PendingAllocation> pending() {

        LocalDate today =
                LocalDate.now();

        /*
         * The old code called:
         *
         * findByStatusOrderByStartDateAsc(BookingStatus.CONFIRMED)
         *
         * Your current Booking uses String status and travelDate,
         * so use findAll() and filter here.
         */

        return bookingRepository
                .findAll()
                .stream()

                .filter(this::isConfirmed)

                .filter(booking ->
                        booking.getTravelDate() != null
                                && !booking
                                .getTravelDate()
                                .isBefore(today)
                )

                .map(booking ->

                        new PendingAllocation(

                                booking.getBookingId(),

                                bookingReference(
                                        booking
                                ),

                                customerName(
                                        booking
                                ),

                                booking.getTourPackage() == null
                                        ? null
                                        : booking
                                        .getTourPackage()
                                        .getName(),

                                booking.getTravelDate(),

                                booking.getTravelDate(),

                                travellerCount(
                                        booking
                                ),

                                missing(
                                        booking
                                )
                        )
                )

                .toList();
    }


    // =========================================================
    // ALLOCATE HOTEL
    // =========================================================

    private void allocateHotel(
            Booking booking,
            Hotel hotel,
            String actor) {

        LocalDate travelDate =
                booking.getTravelDate();

        if (travelDate == null) {

            throw new BusinessException(
                    "Travel date is required"
            );
        }

        /*
         * Current Booking model does not contain a
         * room count, so allocate one room.
         */

        int rooms = 1;

        List<String> conflicts =
                availability.hotelConflicts(
                        hotel,
                        travelDate,
                        travelDate.plusDays(1),
                        rooms
                );

        if (!conflicts.isEmpty()) {

            throw BusinessException.conflict(
                    hotel.getName()
                            + " cannot take this booking - choose another hotel",
                    conflicts
            );
        }

        HotelAvailability row =
                hotelAvailabilityRepository
                        .findByHotelIdAndDate(
                                hotel.getId(),
                                travelDate
                        )
                        .orElseGet(() ->
                                new HotelAvailability(
                                        hotel,
                                        travelDate
                                )
                        );

        row.setBookedRooms(
                row.getBookedRooms() + rooms
        );

        hotelAvailabilityRepository.save(
                row
        );

        save(
                booking,
                ResourceType.HOTEL,
                hotel.getId(),
                hotel.getName()
                        + ", "
                        + hotel.getCity(),
                rooms,
                actor
        );


        if (hotel.getSupplier() != null) {

            notificationService.notifySupplierUsers(
                    hotel.getSupplier().getId(),
                    Notification.Type.BOOKING,

                    "New booking "
                            + bookingReference(booking)
                            + " at "
                            + hotel.getName(),

                    rooms
                            + " room(s) for "
                            + travellerCount(booking)
                            + " guest(s) on "
                            + DAY.format(travelDate)
                            + ".",

                    "/admin/schedule.html"
            );
        }
    }


    // =========================================================
    // ALLOCATE VEHICLE
    // =========================================================

    private void allocateVehicle(
            Booking booking,
            Vehicle vehicle,
            String actor) {

        LocalDate travelDate =
                booking.getTravelDate();

        List<String> conflicts =
                availability.vehicleConflicts(
                        vehicle,
                        travelDate,
                        travelDate,
                        booking.getBookingId()
                );

        if (!conflicts.isEmpty()) {

            throw BusinessException.conflict(
                    vehicle.label()
                            + " is not available - choose another vehicle",
                    conflicts
            );
        }

        save(
                booking,
                ResourceType.VEHICLE,
                vehicle.getId(),
                vehicle.label()
                        + " "
                        + vehicle.getRegistrationNo(),
                1,
                actor
        );


        if (vehicle.getSupplier() != null) {

            notificationService.notifySupplierUsers(
                    vehicle.getSupplier().getId(),
                    Notification.Type.BOOKING,

                    "Vehicle booked: "
                            + vehicle.getRegistrationNo(),

                    "Booking "
                            + bookingReference(booking)
                            + " needs "
                            + vehicle.getModel()
                            + " on "
                            + DAY.format(travelDate)
                            + " for "
                            + travellerCount(booking)
                            + " passenger(s).",

                    "/admin/schedule.html"
            );
        }
    }


    // =========================================================
    // ALLOCATE GUIDE
    // =========================================================

    private void allocateGuide(
            Booking booking,
            TourGuide guide,
            String actor) {

        LocalDate travelDate =
                booking.getTravelDate();

        List<String> conflicts =
                availability.guideConflicts(
                        guide,
                        travelDate,
                        travelDate,
                        booking.getBookingId()
                );

        if (!conflicts.isEmpty()) {

            throw BusinessException.conflict(
                    guide.getFullName()
                            + " is not available - choose another guide",
                    conflicts
            );
        }

        save(
                booking,
                ResourceType.GUIDE,
                guide.getId(),
                guide.getFullName(),
                1,
                actor
        );


        if (guide.getUser() != null) {

            notificationService.notify(
                    guide.getUser(),
                    Notification.Type.BOOKING,

                    "New tour assignment "
                            + bookingReference(booking),

                    packageName(booking)
                            + " on "
                            + DAY.format(travelDate)
                            + " with "
                            + travellerCount(booking)
                            + " traveller(s).",

                    "/admin/schedule.html"
            );
        }
    }


    // =========================================================
    // SAVE ALLOCATION
    // =========================================================

    private void save(
            Booking booking,
            ResourceType type,
            Long resourceId,
            String name,
            int quantity,
            String actor) {

        ResourceAllocation allocation =
                new ResourceAllocation();

        allocation.setBooking(
                booking
        );

        allocation.setResourceType(
                type
        );

        allocation.setResourceId(
                resourceId
        );

        allocation.setResourceName(
                name
        );

        allocation.setStartDate(
                booking.getTravelDate()
        );

        allocation.setEndDate(
                booking.getTravelDate()
        );

        allocation.setQuantity(
                quantity
        );

        allocation.setAllocatedBy(
                actor
        );

        allocationRepository.save(
                allocation
        );
    }


    // =========================================================
    // RELEASE ALLOCATION
    // =========================================================

    private void release(
            Booking booking,
            ResourceType type) {

        List<ResourceAllocation> allocations =
                allocationRepository
                        .findByBookingIdAndStatus(
                                booking.getBookingId(),
                                ResourceAllocation.Status.ALLOCATED
                        );

        for (ResourceAllocation allocation :
                allocations) {

            if (allocation.getResourceType()
                    != type) {

                continue;
            }

            if (type == ResourceType.HOTEL) {

                LocalDate start =
                        allocation.getStartDate();

                if (start != null) {

                    hotelAvailabilityRepository
                            .findByHotelIdAndDate(
                                    allocation.getResourceId(),
                                    start
                            )
                            .ifPresent(row ->
                                    row.setBookedRooms(
                                            Math.max(
                                                    0,
                                                    row.getBookedRooms()
                                                            - allocation.getQuantity()
                                            )
                                    )
                            );
                }
            }

            allocation.setStatus(
                    ResourceAllocation.Status.RELEASED
            );
        }

        allocationRepository.flush();
    }


    // =========================================================
    // FIND BOOKING
    // =========================================================

    private Booking booking(
            Long id) {

        return bookingRepository
                .findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Booking",
                                id
                        )
                );
    }


    // =========================================================
    // HELPER - CONFIRMED
    // =========================================================

    private boolean isConfirmed(
            Booking booking) {

        return booking != null
                && booking.getStatus() != null
                && booking
                .getStatus()
                .trim()
                .equalsIgnoreCase(
                        "CONFIRMED"
                );
    }


    // =========================================================
    // HELPER - TRAVELLER COUNT
    // =========================================================

    private int travellerCount(
            Booking booking) {

        if (booking == null
                || booking.getNumberOfPeople() == null) {

            return 0;
        }

        return booking.getNumberOfPeople();
    }


    // =========================================================
    // HELPER - REFERENCE
    // =========================================================

    private String bookingReference(
            Booking booking) {

        if (booking == null
                || booking.getBookingId() == null) {

            return "BOOKING";
        }

        return "BOOK-"
                + booking.getBookingId();
    }


    // =========================================================
    // HELPER - CUSTOMER NAME
    // =========================================================

    private String customerName(
            Booking booking) {

        if (booking == null
                || booking.getCustomer() == null) {

            return "Customer";
        }

        /*
         * Current User model does not have getFullName().
         */
        if (booking.getCustomer().getEmail() != null) {

            return booking
                    .getCustomer()
                    .getEmail();
        }

        return "Customer";
    }


    // =========================================================
    // HELPER - PACKAGE NAME
    // =========================================================

    private String packageName(
            Booking booking) {

        if (booking == null
                || booking.getTourPackage() == null) {

            return "Tour";
        }

        return booking
                .getTourPackage()
                .getName();
    }
}