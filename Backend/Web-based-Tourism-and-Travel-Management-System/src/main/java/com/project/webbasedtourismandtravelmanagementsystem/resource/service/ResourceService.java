package com.project.webbasedtourismandtravelmanagementsystem.resource.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Manage hotels, tour guides and vehicles, their blocked dates and calendars (Resource sub-functions). */
@Service
@Transactional
public class ResourceService {

    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final ResourceBlockedDateRepository blockedDateRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    public ResourceService(HotelRepository hotelRepository, HotelAvailabilityRepository hotelAvailabilityRepository,
                           VehicleRepository vehicleRepository, TourGuideRepository guideRepository,
                           ResourceBlockedDateRepository blockedDateRepository, ResourceAllocationRepository allocationRepository,
                           SupplierRepository supplierRepository, UserRepository userRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelAvailabilityRepository = hotelAvailabilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.blockedDateRepository = blockedDateRepository;
        this.allocationRepository = allocationRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
    }

    // ------------------------------------------------------------------ hotels

    @Transactional(readOnly = true)
    public List<HotelResponse> hotels() {
        return hotelRepository.findAllByOrderByCityAscNameAsc().stream().map(HotelResponse::from).toList();
    }

    public HotelResponse saveHotel(Long id, HotelRequest r) {
        Hotel h = id == null ? new Hotel() : hotel(id);
        h.setSupplier(supplier(r.supplierId(), Supplier.Type.HOTEL));
        h.setName(r.name().trim());
        h.setCity(r.city().trim());
        h.setAddress(r.address());
        h.setStarRating(r.starRating());
        h.setTotalRooms(r.totalRooms());
        h.setPricePerNight(r.pricePerNight());
        h.setAmenities(r.amenities());
        h.setDescription(r.description());
        h.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? "/images/destinations/kandy.png" : r.imageUrl().trim());
        h.setActive(r.active());
        return HotelResponse.from(hotelRepository.save(h));
    }

    public void deleteHotel(Long id) {
        Hotel h = hotel(id);
        if (allocationRepository.existsByResourceTypeAndResourceId(ResourceType.HOTEL, id)) {
            throw BusinessException.conflict("This hotel has booking history. Mark it inactive instead so it is no longer offered.");
        }
        hotelAvailabilityRepository.findByHotelIdAndDateBetweenOrderByDateAsc(id, LocalDate.of(2000, 1, 1), LocalDate.of(2100, 1, 1))
                .forEach(hotelAvailabilityRepository::delete);
        hotelRepository.delete(h);
    }

    /** Per-night capacity / booked / free rooms with the booking references occupying each night. */
    @Transactional(readOnly = true)
    public List<CalendarDay> hotelCalendar(Long hotelId, LocalDate from, LocalDate to) {
        Hotel h = hotel(hotelId);
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) > 92) {
            throw new BusinessException("Choose a date range of up to 3 months");
        }
        Map<LocalDate, HotelAvailability> rows = new HashMap<>();
        hotelAvailabilityRepository.findByHotelIdAndDateBetweenOrderByDateAsc(hotelId, from, to).forEach(r -> rows.put(r.getDate(), r));
        List<ResourceAllocation> allocations = allocationRepository.findOverlapping(ResourceType.HOTEL, hotelId, from, to,
                ResourceAllocation.Status.ALLOCATED);
        List<CalendarDay> days = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            HotelAvailability row = rows.get(d);
            int capacity = row == null ? h.getTotalRooms() : row.getAvailableRooms();
            int booked = row == null ? 0 : row.getBookedRooms();
            final LocalDate night = d;
            List<String> refs = allocations.stream()
                    .filter(a -> !night.isBefore(a.getStartDate()) && night.isBefore(a.getEndDate()))
                    .map(a -> a.getBooking().getReference())
                    .toList();
            days.add(new CalendarDay(d, capacity, booked, Math.max(0, capacity - booked), refs));
        }
        return days;
    }

    // ------------------------------------------------------------------ vehicles

    @Transactional(readOnly = true)
    public List<VehicleResponse> vehicles() {
        return vehicleRepository.findAllByOrderBySeatsAscModelAsc().stream().map(VehicleResponse::from).toList();
    }

    public VehicleResponse saveVehicle(Long id, VehicleRequest r) {
        Vehicle v = id == null ? new Vehicle() : vehicle(id);
        String reg = r.registrationNo().trim().toUpperCase(Locale.ROOT);
        if ((id == null || !v.getRegistrationNo().equalsIgnoreCase(reg)) && vehicleRepository.existsByRegistrationNoIgnoreCase(reg)) {
            throw BusinessException.conflict("A vehicle with registration " + reg + " already exists");
        }
        validateSeats(r.type(), r.seats());
        v.setSupplier(supplier(r.supplierId(), Supplier.Type.TRANSPORT));
        v.setType(r.type());
        v.setModel(r.model().trim());
        v.setRegistrationNo(reg);
        v.setSeats(r.seats());
        v.setPricePerDay(r.pricePerDay());
        v.setDriverName(r.driverName() == null || r.driverName().isBlank() ? null : r.driverName().trim());
        v.setAirConditioned(r.airConditioned());
        v.setActive(r.active());
        return VehicleResponse.from(vehicleRepository.save(v));
    }

    public void deleteVehicle(Long id) {
        Vehicle v = vehicle(id);
        if (allocationRepository.existsByResourceTypeAndResourceId(ResourceType.VEHICLE, id)) {
            throw BusinessException.conflict("This vehicle has booking history. Mark it inactive instead.");
        }
        blockedDateRepository.findByResourceTypeAndResourceIdAndDateGreaterThanEqualOrderByDateAsc(ResourceType.VEHICLE, id, LocalDate.of(2000, 1, 1))
                .forEach(blockedDateRepository::delete);
        vehicleRepository.delete(v);
    }

    /** SP3-02: seats must make sense for the vehicle type (validate vehicle capacity). */
    static void validateSeats(Vehicle.Type type, int seats) {
        int max = switch (type) {
            case TUK_TUK -> 3;
            case CAR -> 4;
            case SUV -> 7;
            case VAN -> 14;
            case MINI_COACH -> 29;
            case COACH -> 60;
        };
        if (seats > max) {
            throw new BusinessException("A " + type.name().replace('_', ' ').toLowerCase(Locale.ROOT) + " can have at most " + max + " passenger seats");
        }
    }

    // ------------------------------------------------------------------ guides

    @Transactional(readOnly = true)
    public List<GuideResponse> guides() {
        return guideRepository.findAllByOrderByFullNameAsc().stream().map(GuideResponse::from).toList();
    }

    /** @param canLinkAccount only the System Administrator links or unlinks a guide's portal login */
    public GuideResponse saveGuide(Long id, GuideRequest r, boolean canLinkAccount) {
        TourGuide g = id == null ? new TourGuide() : guide(id);
        String licence = r.licenseNo().trim().toUpperCase(Locale.ROOT);
        if ((id == null || !g.getLicenseNo().equalsIgnoreCase(licence)) && guideRepository.existsByLicenseNoIgnoreCase(licence)) {
            throw BusinessException.conflict("A guide with licence " + licence + " already exists");
        }
        g.setSupplier(supplier(r.supplierId(), Supplier.Type.TOUR_GUIDE));
        if (!canLinkAccount) {
            // keep the current portal login link unchanged
        } else if (r.userId() != null) {
            User user = userRepository.findById(r.userId()).orElseThrow(() -> new NotFoundException("User", r.userId()));
            if (user.getRole() != Role.TOUR_GUIDE) {
                throw new BusinessException("Only accounts with the Tour Guide role can be linked to a guide");
            }
            guideRepository.findByUserId(user.getId()).filter(other -> !other.getId().equals(g.getId())).ifPresent(other -> {
                throw BusinessException.conflict("That account is already linked to guide " + other.getFullName());
            });
            g.setUser(user);
        } else {
            g.setUser(null);
        }
        g.setFullName(r.fullName().trim());
        g.setLicenseNo(licence);
        g.setLanguages(r.languages().trim());
        g.setSpecialization(r.specialization());
        g.setExperienceYears(r.experienceYears());
        g.setPricePerDay(r.pricePerDay());
        g.setPhone(r.phone());
        g.setEmail(r.email());
        g.setActive(r.active());
        return GuideResponse.from(guideRepository.save(g));
    }

    public void deleteGuide(Long id) {
        TourGuide g = guide(id);
        if (allocationRepository.existsByResourceTypeAndResourceId(ResourceType.GUIDE, id)) {
            throw BusinessException.conflict("This guide has tour history. Mark the guide inactive instead.");
        }
        blockedDateRepository.findByResourceTypeAndResourceIdAndDateGreaterThanEqualOrderByDateAsc(ResourceType.GUIDE, id, LocalDate.of(2000, 1, 1))
                .forEach(blockedDateRepository::delete);
        guideRepository.delete(g);
    }

    // ------------------------------------------------------------------ blocked dates (vehicles + guides)

    @Transactional(readOnly = true)
    public List<BlockedDateResponse> blockedDates(ResourceType type, Long id) {
        return blockedDateRepository.findByResourceTypeAndResourceIdAndDateGreaterThanEqualOrderByDateAsc(type, id, LocalDate.now())
                .stream().map(BlockedDateResponse::from).toList();
    }

    /** Marks a vehicle or guide unavailable. Dates already allocated to a booking are rejected with the booking refs. */
    public List<BlockedDateResponse> block(ResourceType type, Long id, BlockDatesRequest r) {
        if (type == ResourceType.HOTEL) {
            throw new BusinessException("Hotel availability is managed with the room schedule");
        }
        if (type == ResourceType.VEHICLE) {
            vehicle(id);
        } else {
            guide(id);
        }
        validateRange(r.startDate(), r.endDate());
        List<String> conflicts = allocationRepository.findOverlapping(type, id, r.startDate(), r.endDate(), ResourceAllocation.Status.ALLOCATED)
                .stream().map(a -> "Booking " + a.getBooking().getReference() + " (" + a.getStartDate() + " to " + a.getEndDate() + ")")
                .toList();
        if (!conflicts.isEmpty()) {
            throw BusinessException.conflict("These dates are already allocated to bookings. Ask the Tour Operations Manager to re-allocate them first.", conflicts);
        }
        for (LocalDate d = r.startDate(); !d.isAfter(r.endDate()); d = d.plusDays(1)) {
            if (blockedDateRepository.findByResourceTypeAndResourceIdAndDate(type, id, d).isEmpty()) {
                blockedDateRepository.save(new ResourceBlockedDate(type, id, d, r.reason()));
            }
        }
        return blockedDates(type, id);
    }

    public void unblock(ResourceType type, Long resourceId, Long blockedDateId) {
        ResourceBlockedDate b = blockedDateRepository.findById(blockedDateId)
                .filter(x -> x.getResourceType() == type && x.getResourceId().equals(resourceId))
                .orElseThrow(() -> new NotFoundException("Blocked date", blockedDateId));
        blockedDateRepository.delete(b);
    }

    // ------------------------------------------------------------------ helpers

    static void validateRange(LocalDate start, LocalDate end) {
        if (start.isBefore(LocalDate.now())) {
            throw new BusinessException("Dates in the past cannot be changed");
        }
        if (end.isBefore(start)) {
            throw new BusinessException("The end date must be on or after the start date");
        }
        if (ChronoUnit.DAYS.between(start, end) > 180) {
            throw new BusinessException("Update at most 6 months at a time");
        }
    }

    private Supplier supplier(Long id, Supplier.Type expected) {
        if (id == null) {
            return null;
        }
        Supplier s = supplierRepository.findById(id).orElseThrow(() -> new NotFoundException("Supplier", id));
        if (s.getType() != expected) {
            throw new BusinessException("Choose a supplier of type " + expected);
        }
        return s;
    }

    public Hotel hotel(Long id) {
        return hotelRepository.findById(id).orElseThrow(() -> new NotFoundException("Hotel", id));
    }

    public Vehicle vehicle(Long id) {
        return vehicleRepository.findById(id).orElseThrow(() -> new NotFoundException("Vehicle", id));
    }

    public TourGuide guide(Long id) {
        return guideRepository.findById(id).orElseThrow(() -> new NotFoundException("Tour guide", id));
    }
}
