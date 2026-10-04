package com.project.webbasedtourismandtravelmanagementsystem.resource.service;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * UC-01 Allocate Resources to Confirmed Booking (IT25101444 Meheramba E.N.).
 * After payment the tourist's chosen hotel, vehicle and a guide are allocated automatically;
 * the Logistic Supplier Management team can allocate or re-allocate them here.
 */
@Service
@Transactional
public class AllocationService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd MMM");

    private final BookingRepository bookingRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final AvailabilityService availability;
    private final NotificationService notificationService;

    public AllocationService(BookingRepository bookingRepository, ResourceAllocationRepository allocationRepository,
                             HotelRepository hotelRepository, HotelAvailabilityRepository hotelAvailabilityRepository,
                             VehicleRepository vehicleRepository, TourGuideRepository guideRepository,
                             AvailabilityService availability, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.allocationRepository = allocationRepository;
        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository = hotelAvailabilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.availability = availability;
        this.notificationService = notificationService;
    }

    // ------------------------------------------------------------------ UC-01 steps 1-4

    @Transactional(readOnly = true)
    public AllocationView view(Long bookingId) {
        Booking b = booking(bookingId);
        List<String> warnings = new ArrayList<>();
        List<ResourceOption> hotels = b.nights() > 0
                ? availability.hotelOptions(b.getTourPackage().destinationList(), b.getStartDate(), b.getEndDate(), b.getRooms())
                : List.of();
        List<ResourceOption> vehicles = availability.vehicleOptions(b.travellerCount(), b.getStartDate(), b.getEndDate(), b.getId());
        List<ResourceOption> guides = availability.guideOptions(b.getGuideLanguage(), b.getStartDate(), b.getEndDate(), b.getId());

        if (b.nights() > 0 && hotels.stream().noneMatch(o -> o.available() && !o.alternative())) {
            warnings.add("No hotel in the tour area has enough rooms - alternatives from other towns are shown (3a)");
        }
        if (b.getPreferredVehicle() == null) {
            warnings.add("The tourist did not book transport (own arrangement) - a vehicle is optional for this booking");
        } else if (vehicles.stream().noneMatch(ResourceOption::available)) {
            warnings.add("No vehicle with " + b.travellerCount() + "+ seats is free for these dates (3b)");
        }
        if (b.isGuideRequired() && guides.stream().noneMatch(ResourceOption::available)) {
            warnings.add("No tour guide is free for these dates (3c)");
        }
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            warnings.add("Only confirmed bookings can be allocated. This booking is " + b.getStatus());
        }
        List<AllocationResponse> current = allocationRepository.findByBookingIdAndStatus(b.getId(), ResourceAllocation.Status.ALLOCATED)
                .stream().map(AllocationResponse::from).toList();
        return new AllocationView(b.getId(), b.getReference(), b.getCustomer().getFullName(), b.getTourPackage().getName(),
                b.getTourPackage().destinationList(), b.getStartDate(), b.getEndDate(), b.nights(), b.travellerCount(),
                b.getRooms(), b.isGuideRequired(), b.getGuideLanguage(), b.getSpecialRequests(),
                b.getPreferredHotel() == null ? null : b.getPreferredHotel().getId(),
                b.getPreferredVehicle() == null ? null : b.getPreferredVehicle().getId(),
                current, hotels, vehicles, guides, warnings);
    }

    // ------------------------------------------------------------------ UC-01 steps 5-9

    public List<AllocationResponse> allocate(Long bookingId, AllocateRequest req, String actor) {
        Booking b = booking(bookingId);
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Resources can only be allocated to confirmed bookings (this booking is " + b.getStatus() + ")");
        }
        if (b.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessException("This tour has already finished");
        }
        if (req.hotelId() == null && req.vehicleId() == null && req.guideId() == null) {
            throw new BusinessException("Select at least one hotel, vehicle or tour guide");
        }
        List<String> assigned = new ArrayList<>();
        if (req.hotelId() != null) {
            if (b.nights() == 0) {
                throw new BusinessException("This is a day tour - no hotel is needed");
            }
            Hotel hotel = hotelRepository.findById(req.hotelId()).orElseThrow(() -> new NotFoundException("Hotel", req.hotelId()));
            release(b, ResourceType.HOTEL);
            allocateHotel(b, hotel, actor);
            assigned.add("hotel " + hotel.getName());
        }
        if (req.vehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(req.vehicleId()).orElseThrow(() -> new NotFoundException("Vehicle", req.vehicleId()));
            if (vehicle.getSeats() < b.travellerCount()) {
                throw new BusinessException(vehicle.label() + " has fewer seats than the " + b.travellerCount() + " travellers");
            }
            release(b, ResourceType.VEHICLE);
            allocateVehicle(b, vehicle, actor);
            assigned.add("vehicle " + vehicle.label());
        }
        if (req.guideId() != null) {
            TourGuide guide = guideRepository.findById(req.guideId()).orElseThrow(() -> new NotFoundException("Tour guide", req.guideId()));
            release(b, ResourceType.GUIDE);
            allocateGuide(b, guide, actor);
            assigned.add("guide " + guide.getFullName());
        }
        notificationService.notify(b.getCustomer(), Notification.Type.ALLOCATION, "Your trip resources are confirmed",
                "Booking " + b.getReference() + ": we have assigned your " + String.join(", ", assigned) + ".",
                "/customer/bookings.html");
        return allocationRepository.findByBookingIdAndStatus(b.getId(), ResourceAllocation.Status.ALLOCATED)
                .stream().map(AllocationResponse::from).toList();
    }

    /**
     * Called right after a successful payment. Each resource is tried independently; anything that
     * cannot be allocated is reported to the Logistic Supplier Management team to handle in UC-01.
     */
    public List<String> autoAllocate(Booking b) {
        List<String> problems = new ArrayList<>();
        if (b.nights() > 0 && b.getPreferredHotel() != null) {
            try {
                allocateHotel(b, b.getPreferredHotel(), "System (auto)");
            } catch (BusinessException e) {
                problems.add("hotel: " + e.getMessage());
            }
        }
        if (b.getPreferredVehicle() != null) {
            try {
                allocateVehicle(b, b.getPreferredVehicle(), "System (auto)");
            } catch (BusinessException e) {
                problems.add("vehicle: " + e.getMessage());
            }
        }
        if (b.isGuideRequired()) {
            availability.cheapestAvailableGuide(b.getGuideLanguage(), b.getStartDate(), b.getEndDate())
                    .ifPresentOrElse(g -> allocateGuide(b, g, "System (auto)"),
                            () -> problems.add("guide: no tour guide is free for these dates"));
        }
        if (!problems.isEmpty()) {
            notificationService.notifyRole(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.ALLOCATION,
                    "Allocation needed for " + b.getReference(),
                    "Automatic allocation could not complete: " + String.join("; ", problems),
                    "/admin/allocations.html?booking=" + b.getId());
        }
        return problems;
    }

    /** Frees every resource of a cancelled booking so others can book them. */
    public void releaseAll(Booking b) {
        for (ResourceType type : ResourceType.values()) {
            release(b, type);
        }
    }

    @Transactional(readOnly = true)
    public List<AllocationResponse> current(Long bookingId) {
        return allocationRepository.findByBookingIdAndStatus(bookingId, ResourceAllocation.Status.ALLOCATED)
                .stream().map(AllocationResponse::from).toList();
    }

    /** What a booking still needs: hotel (if it has nights), vehicle (if transport was chosen), guide (if requested). */
    @Transactional(readOnly = true)
    public List<String> missing(Booking b) {
        List<ResourceAllocation> current = allocationRepository.findByBookingIdAndStatus(b.getId(), ResourceAllocation.Status.ALLOCATED);
        List<String> missing = new ArrayList<>();
        if (b.nights() > 0 && current.stream().noneMatch(a -> a.getResourceType() == ResourceType.HOTEL)) {
            missing.add("Hotel");
        }
        if (b.getPreferredVehicle() != null && current.stream().noneMatch(a -> a.getResourceType() == ResourceType.VEHICLE)) {
            missing.add("Vehicle");
        }
        if (b.isGuideRequired() && current.stream().noneMatch(a -> a.getResourceType() == ResourceType.GUIDE)) {
            missing.add("Guide");
        }
        return missing;
    }

    @Transactional(readOnly = true)
    public List<PendingAllocation> pending() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findByStatusOrderByStartDateAsc(BookingStatus.CONFIRMED).stream()
                .filter(b -> !b.getEndDate().isBefore(today))
                .map(b -> new PendingAllocation(b.getId(), b.getReference(), b.getCustomer().getFullName(),
                        b.getTourPackage().getName(), b.getStartDate(), b.getEndDate(), b.travellerCount(), missing(b)))
                .toList();
    }

    // ------------------------------------------------------------------ internals

    private void allocateHotel(Booking b, Hotel hotel, String actor) {
        // step 6: verify the rooms are still free for every night (6a / 6b)
        List<String> conflicts = availability.hotelConflicts(hotel, b.getStartDate(), b.getEndDate(), b.getRooms());
        if (!conflicts.isEmpty()) {
            throw BusinessException.conflict(hotel.getName() + " cannot take this booking - choose another hotel", conflicts);
        }
        // step 8: update availability so nobody else gets the same rooms
        for (LocalDate night = b.getStartDate(); night.isBefore(b.getEndDate()); night = night.plusDays(1)) {
            final LocalDate d = night;
            HotelAvailability row = hotelAvailabilityRepository.findByHotelIdAndDate(hotel.getId(), d)
                    .orElseGet(() -> new HotelAvailability(hotel, d));
            row.setBookedRooms(row.getBookedRooms() + b.getRooms());
            hotelAvailabilityRepository.save(row);
        }
        save(b, ResourceType.HOTEL, hotel.getId(), hotel.getName() + ", " + hotel.getCity(), b.getRooms(), actor);
        if (hotel.getSupplier() != null) {
            notificationService.notifySupplierUsers(hotel.getSupplier().getId(), Notification.Type.BOOKING,
                    "New booking " + b.getReference() + " at " + hotel.getName(),
                    b.getRooms() + " room(s) for " + b.travellerCount() + " guest(s), " + DAY.format(b.getStartDate())
                            + " - " + DAY.format(b.getEndDate()) + ". Lead guest: " + b.getCustomer().getFullName()
                            + (b.getSpecialRequests() == null ? "" : ". Requests: " + b.getSpecialRequests()),
                    "/admin/schedule.html");
        }
    }

    private void allocateVehicle(Booking b, Vehicle vehicle, String actor) {
        List<String> conflicts = availability.vehicleConflicts(vehicle, b.getStartDate(), b.getEndDate(), b.getId());
        if (!conflicts.isEmpty()) {
            throw BusinessException.conflict(vehicle.label() + " is not available - choose another vehicle", conflicts);
        }
        save(b, ResourceType.VEHICLE, vehicle.getId(), vehicle.label() + " " + vehicle.getRegistrationNo(), 1, actor);
        if (vehicle.getSupplier() != null) {
            notificationService.notifySupplierUsers(vehicle.getSupplier().getId(), Notification.Type.BOOKING,
                    "Vehicle booked: " + vehicle.getRegistrationNo(),
                    "Booking " + b.getReference() + " (" + b.getTourPackage().getName() + ") needs "
                            + vehicle.getModel() + " from " + DAY.format(b.getStartDate()) + " to " + DAY.format(b.getEndDate())
                            + " for " + b.travellerCount() + " passenger(s).",
                    "/admin/schedule.html");
        }
    }

    private void allocateGuide(Booking b, TourGuide guide, String actor) {
        List<String> conflicts = availability.guideConflicts(guide, b.getStartDate(), b.getEndDate(), b.getId());
        if (!conflicts.isEmpty()) {
            throw BusinessException.conflict(guide.getFullName() + " is not available - choose another guide", conflicts);
        }
        save(b, ResourceType.GUIDE, guide.getId(), guide.getFullName(), 1, actor);
        if (guide.getUser() != null) {
            notificationService.notify(guide.getUser(), Notification.Type.BOOKING, "New tour assignment " + b.getReference(),
                    b.getTourPackage().getName() + " from " + DAY.format(b.getStartDate()) + " to " + DAY.format(b.getEndDate())
                            + " with " + b.travellerCount() + " traveller(s).",
                    "/admin/schedule.html");
        }
    }

    private void save(Booking b, ResourceType type, Long resourceId, String name, int quantity, String actor) {
        ResourceAllocation a = new ResourceAllocation();
        a.setBooking(b);
        a.setResourceType(type);
        a.setResourceId(resourceId);
        a.setResourceName(name);
        a.setStartDate(b.getStartDate());
        a.setEndDate(b.getEndDate());
        a.setQuantity(quantity);
        a.setAllocatedBy(actor);
        allocationRepository.save(a);
    }

    private void release(Booking b, ResourceType type) {
        for (ResourceAllocation a : allocationRepository.findByBookingIdAndStatus(b.getId(), ResourceAllocation.Status.ALLOCATED)) {
            if (a.getResourceType() != type) {
                continue;
            }
            if (type == ResourceType.HOTEL) {
                for (LocalDate night = a.getStartDate(); night.isBefore(a.getEndDate()); night = night.plusDays(1)) {
                    hotelAvailabilityRepository.findByHotelIdAndDate(a.getResourceId(), night)
                            .ifPresent(row -> row.setBookedRooms(Math.max(0, row.getBookedRooms() - a.getQuantity())));
                }
            }
            a.setStatus(ResourceAllocation.Status.RELEASED);
        }
        allocationRepository.flush();
    }

    private Booking booking(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new NotFoundException("Booking", id));
    }
}
