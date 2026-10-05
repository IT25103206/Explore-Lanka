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
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Logistic partner portal (IT25103206 Kodagoda O.I):
 *  - UC-03 Update Hotel Schedule Manually (hotel partners)
 *  - vehicle choices and unavailable days (transport providers, PBI-11)
 *  - assigned tours, unavailable days and manual route waypoints (tour guides, PBI-10)
 *  - booking details for allocated resources (PBI-12)
 */
@Service
@Transactional
public class PartnerScheduleService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final CurrentUser currentUser;
    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final BookingRepository bookingRepository;
    private final ItineraryRepository itineraryRepository;
    private final ResourceService resourceService;
    private final NotificationService notificationService;

    public PartnerScheduleService(CurrentUser currentUser, HotelRepository hotelRepository,
                                  HotelAvailabilityRepository hotelAvailabilityRepository, VehicleRepository vehicleRepository,
                                  TourGuideRepository guideRepository, ResourceAllocationRepository allocationRepository,
                                  BookingRepository bookingRepository, ItineraryRepository itineraryRepository,
                                  ResourceService resourceService, NotificationService notificationService) {
        this.currentUser = currentUser;
        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository = hotelAvailabilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.allocationRepository = allocationRepository;
        this.bookingRepository = bookingRepository;
        this.itineraryRepository = itineraryRepository;
        this.resourceService = resourceService;
        this.notificationService = notificationService;
    }

    // ------------------------------------------------------------------ hotel partner (UC-03)

    @Transactional(readOnly = true)
    public List<HotelResponse> myHotels() {
        User me = requireRole(Role.HOTEL_PARTNER);
        return hotelRepository.findBySupplierIdOrderByNameAsc(supplierId(me)).stream().map(HotelResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CalendarDay> hotelCalendar(Long hotelId, LocalDate from, LocalDate to) {
        ownHotel(hotelId);
        return resourceService.hotelCalendar(hotelId, from, to);
    }

    /**
     * UC-03 main scenario: validate (4a), check conflicts with existing bookings (5a),
     * store the new availability and notify the Logistic Supplier Management team (step 5 sync).
     */
    public List<CalendarDay> updateHotelSchedule(Long hotelId, ScheduleUpdateRequest r) {
        Hotel hotel = ownHotel(hotelId);
        ResourceService.validateRange(r.startDate(), r.endDate());   // 4a invalid dates

        Map<LocalDate, HotelAvailability> rows = new HashMap<>();
        hotelAvailabilityRepository.findByHotelIdAndDateBetweenOrderByDateAsc(hotelId, r.startDate(), r.endDate())
                .forEach(row -> rows.put(row.getDate(), row));

        // 5a: a partner cannot go below the rooms already booked - list the affected booking refs
        List<String> conflicts = new ArrayList<>();
        Set<String> refs = new TreeSet<>();
        List<ResourceAllocation> allocations = allocationRepository.findOverlapping(ResourceType.HOTEL, hotelId,
                r.startDate(), r.endDate(), ResourceAllocation.Status.ALLOCATED);
        for (LocalDate d = r.startDate(); !d.isAfter(r.endDate()); d = d.plusDays(1)) {
            HotelAvailability row = rows.get(d);
            int booked = row == null ? 0 : row.getBookedRooms();
            if (r.availableRooms() < booked) {
                final LocalDate night = d;
                List<String> onNight = allocations.stream()
                        .filter(a -> !night.isBefore(a.getStartDate()) && night.isBefore(a.getEndDate()))
                        .map(a -> a.getBooking().getReference())
                        .toList();
                refs.addAll(onNight);
                conflicts.add(DAY.format(d) + ": " + booked + " room(s) already booked by " + String.join(", ", onNight));
            }
        }
        if (!conflicts.isEmpty()) {
            notificationService.notifyRoleIndependently(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.SCHEDULE,
                    "Schedule conflict at " + hotel.getName(),
                    hotel.getName() + " tried to reduce rooms to " + r.availableRooms() + " between " + DAY.format(r.startDate())
                            + " and " + DAY.format(r.endDate()) + ", which affects bookings " + String.join(", ", refs)
                            + ". Please contact the partner.",
                    "/admin/allocations.html");
            throw BusinessException.conflict("Pending bookings need more rooms than you entered. The update was not saved and the Logistic Supplier Management team has been informed.", conflicts);
        }

        for (LocalDate d = r.startDate(); !d.isAfter(r.endDate()); d = d.plusDays(1)) {
            final LocalDate date = d;
            HotelAvailability row = rows.getOrDefault(d, null);
            if (row == null) {
                row = new HotelAvailability(hotel, date);
            }
            row.setAvailableRooms(r.availableRooms());
            hotelAvailabilityRepository.save(row);
        }
        notificationService.notifyRole(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.SCHEDULE,
                "Availability updated: " + hotel.getName(),
                hotel.getName() + " now offers " + r.availableRooms() + " room(s) per night from " + DAY.format(r.startDate())
                        + " to " + DAY.format(r.endDate()) + ".",
                "/admin/resources.html");
        return resourceService.hotelCalendar(hotelId, r.startDate(), r.endDate());
    }

    // ------------------------------------------------------------------ transport provider

    @Transactional(readOnly = true)
    public List<VehicleResponse> myVehicles() {
        User me = requireRole(Role.TRANSPORT_PROVIDER);
        return vehicleRepository.findBySupplierIdOrderByModelAsc(supplierId(me)).stream().map(VehicleResponse::from).toList();
    }

    /** PBI-11: transport providers add their own vehicle choices (always under their own supplier). */
    public VehicleResponse saveMyVehicle(Long id, VehicleRequest r) {
        User me = requireRole(Role.TRANSPORT_PROVIDER);
        if (id != null) {
            ownVehicle(id);
        }
        VehicleRequest scoped = new VehicleRequest(supplierId(me), r.type(), r.model(), r.registrationNo(), r.seats(),
                r.pricePerDay(), r.driverName(), r.airConditioned(), r.active());
        return resourceService.saveVehicle(id, scoped);
    }

    // ------------------------------------------------------------------ blocked days (vehicles + guide)

    @Transactional(readOnly = true)
    public List<BlockedDateResponse> blockedDates(ResourceType type, Long id) {
        checkOwnership(type, id);
        return resourceService.blockedDates(type, id);
    }

    public List<BlockedDateResponse> block(ResourceType type, Long id, BlockDatesRequest r) {
        checkOwnership(type, id);
        List<BlockedDateResponse> result = resourceService.block(type, id, r);
        notificationService.notifyRole(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.SCHEDULE,
                "Partner marked days unavailable",
                currentUser.details().getFullName() + " blocked " + type.name().toLowerCase(Locale.ROOT) + " #" + id
                        + " from " + DAY.format(r.startDate()) + " to " + DAY.format(r.endDate())
                        + (r.reason() == null || r.reason().isBlank() ? "" : " (" + r.reason() + ")") + ".",
                "/admin/resources.html");
        return result;
    }

    public void unblock(ResourceType type, Long id, Long blockedDateId) {
        checkOwnership(type, id);
        resourceService.unblock(type, id, blockedDateId);
    }

    // ------------------------------------------------------------------ tour guide

    @Transactional(readOnly = true)
    public GuideResponse myGuideProfile() {
        return GuideResponse.from(myGuide());
    }

    /** PBI-10 extension "Add manual waypoints": the assigned guide adds a stop to the booking's route plan. */
    public void addWaypoint(Long bookingId, WaypointRequest r) {
        TourGuide guide = myGuide();
        boolean assigned = allocationRepository.findByBookingIdAndStatus(bookingId, ResourceAllocation.Status.ALLOCATED).stream()
                .anyMatch(a -> a.getResourceType() == ResourceType.GUIDE && a.getResourceId().equals(guide.getId()));
        if (!assigned) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You can only add waypoints to tours assigned to you");
        }
        Booking b = bookingRepository.findById(bookingId).orElseThrow(() -> new NotFoundException("Booking", bookingId));
        int totalDays = b.nights() + 1;
        if (r.dayNumber() > totalDays) {
            throw new BusinessException("This tour has only " + totalDays + " day(s)");
        }
        Itinerary itinerary = itineraryRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BusinessException("The itinerary for this booking has not been generated yet"));
        itinerary.addItem(new ItineraryItem(r.dayNumber(), b.getStartDate().plusDays(r.dayNumber() - 1L),
                ItineraryItem.Type.WAYPOINT, r.title().trim(), r.description(), r.location(), r.route(), guide.getFullName()));
    }

    // ------------------------------------------------------------------ assignments (all partner types)

    /** Upcoming allocations for the logged-in partner's hotels, vehicles or guide profile. */
    @Transactional(readOnly = true)
    public List<Assignment> myAssignments() {
        User me = currentUser.entity();
        ResourceType type;
        List<Long> ids;
        switch (me.getRole()) {
            case HOTEL_PARTNER -> {
                type = ResourceType.HOTEL;
                ids = hotelRepository.findBySupplierIdOrderByNameAsc(supplierId(me)).stream().map(Hotel::getId).toList();
            }
            case TRANSPORT_PROVIDER -> {
                type = ResourceType.VEHICLE;
                ids = vehicleRepository.findBySupplierIdOrderByModelAsc(supplierId(me)).stream().map(Vehicle::getId).toList();
            }
            case TOUR_GUIDE -> {
                type = ResourceType.GUIDE;
                ids = List.of(myGuide().getId());
            }
            default -> throw new BusinessException(HttpStatus.FORBIDDEN, "Only logistic partners have assignments");
        }
        if (ids.isEmpty()) {
            return List.of();
        }
        return allocationRepository.findByResourceTypeAndResourceIdInAndStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(
                        type, ids, ResourceAllocation.Status.ALLOCATED, LocalDate.now().minusDays(1)).stream()
                .map(a -> {
                    Booking b = a.getBooking();
                    String lead = b.getTravelers().isEmpty() ? b.getCustomer().getFullName() : b.getTravelers().get(0).getFullName();
                    return new Assignment(a.getId(), b.getId(), b.getReference(), b.getTourPackage().getName(),
                            a.getResourceName(), a.getResourceType(), a.getStartDate(), a.getEndDate(), a.getQuantity(),
                            b.travellerCount(), lead, b.getCustomer().getPhone(), b.getSpecialRequests(), b.getGuideLanguage());
                })
                .toList();
    }

    // ------------------------------------------------------------------ ownership helpers

    private void checkOwnership(ResourceType type, Long id) {
        switch (type) {
            case VEHICLE -> ownVehicle(id);
            case GUIDE -> {
                if (!myGuide().getId().equals(id)) {
                    throw new BusinessException(HttpStatus.FORBIDDEN, "You can only manage your own schedule");
                }
            }
            case HOTEL -> ownHotel(id);
        }
    }

    private Hotel ownHotel(Long hotelId) {
        User me = requireRole(Role.HOTEL_PARTNER);
        Hotel h = resourceService.hotel(hotelId);
        if (h.getSupplier() == null || !h.getSupplier().getId().equals(supplierId(me))) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "This hotel does not belong to your company");
        }
        return h;
    }

    private Vehicle ownVehicle(Long vehicleId) {
        User me = requireRole(Role.TRANSPORT_PROVIDER);
        Vehicle v = resourceService.vehicle(vehicleId);
        if (v.getSupplier() == null || !v.getSupplier().getId().equals(supplierId(me))) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "This vehicle does not belong to your company");
        }
        return v;
    }

    private TourGuide myGuide() {
        User me = requireRole(Role.TOUR_GUIDE);
        return guideRepository.findByUserId(me.getId())
                .orElseThrow(() -> new BusinessException("Your account is not linked to a tour guide profile yet. Please contact the operations team."));
    }

    private User requireRole(Role role) {
        User me = currentUser.entity();
        if (me.getRole() != role) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "This section is for " + role.getDisplayName() + " accounts");
        }
        return me;
    }

    private static Long supplierId(User me) {
        if (me.getSupplier() == null) {
            throw new BusinessException("Your account is not linked to a supplier yet. Please contact the operations team.");
        }
        return me.getSupplier().getId();
    }
}
