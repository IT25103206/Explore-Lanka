package com.project.webbasedtourismandtravelmanagementsystem.partner.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.model.Feedback;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.partner.dto.PartnerDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.ServiceRate;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.SupplierContract;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.ServiceRateRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierContractRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/** Partner & Supplier Management (IT25102242 Nethwin S.W.S) - UC-02 Manage Service Rate. */
@Service
@Transactional
public class PartnerService {

    /** Rate changes above this percentage need System Administrator approval. */
    public static final BigDecimal APPROVAL_THRESHOLD = new BigDecimal("20");

    private final SupplierRepository supplierRepository;
    private final SupplierContractRepository contractRepository;
    private final ServiceRateRepository rateRepository;
    private final HotelRepository hotelRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public PartnerService(SupplierRepository supplierRepository, SupplierContractRepository contractRepository,
                          ServiceRateRepository rateRepository, HotelRepository hotelRepository,
                          VehicleRepository vehicleRepository, TourGuideRepository guideRepository,
                          ResourceAllocationRepository allocationRepository, FeedbackRepository feedbackRepository,
                          UserRepository userRepository, NotificationService notificationService) {
        this.supplierRepository = supplierRepository;
        this.contractRepository = contractRepository;
        this.rateRepository = rateRepository;
        this.hotelRepository = hotelRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.allocationRepository = allocationRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ------------------------------------------------------------------ supplier records

    @Transactional(readOnly = true)
    public List<SupplierResponse> list() {
        Performance perf = performance();
        return supplierRepository.findAllByOrderByNameAsc().stream().map(s -> toResponse(s, perf)).toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse get(Long id) {
        return toResponse(find(id), performance());
    }

    public SupplierResponse save(Long id, SupplierRequest r) {
        Supplier s = id == null ? new Supplier() : find(id);
        if (id != null && s.getType() != r.type() && !resourceIds(s).isEmpty()) {
            throw new BusinessException("The supplier type cannot change while it still has hotels, vehicles or guides");
        }
        s.setName(r.name().trim());
        s.setType(r.type());
        s.setContactPerson(r.contactPerson());
        s.setEmail(r.email().trim().toLowerCase(Locale.ROOT));
        s.setPhone(r.phone());
        s.setAddress(r.address());
        s.setNotes(r.notes());
        return toResponse(supplierRepository.save(s), performance());
    }

    /**
     * PBI-23 remove inactive suppliers: an INACTIVE supplier's resources are excluded from all
     * availability checks and allocations. Upcoming allocations are reported for re-allocation.
     */
    public SupplierResponse changeStatus(Long id, Supplier.Status status) {
        Supplier s = find(id);
        s.setStatus(status);
        if (status == Supplier.Status.INACTIVE) {
            List<Long> ids = resourceIds(s);
            ResourceType type = resourceType(s);
            List<String> refs = ids.isEmpty() ? List.of()
                    : allocationRepository.findByResourceTypeAndResourceIdInAndStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(
                            type, ids, ResourceAllocation.Status.ALLOCATED, LocalDate.now())
                    .stream().map(a -> a.getBooking().getReference()).distinct().toList();
            if (!refs.isEmpty()) {
                notificationService.notifyRole(Role.LOGISTIC_SUPPLIER_MANAGER, Notification.Type.ALLOCATION,
                        "Re-allocate bookings: " + s.getName() + " deactivated",
                        "These upcoming bookings use resources of " + s.getName() + ": " + String.join(", ", refs),
                        "/admin/allocations.html");
            }
        }
        return toResponse(s, performance());
    }

    public void delete(Long id) {
        Supplier s = find(id);
        ResourceType type = resourceType(s);
        List<Long> ids = resourceIds(s);
        if (!ids.isEmpty() && allocationRepository.countByResourceTypeAndResourceIdIn(type, ids) > 0) {
            throw BusinessException.conflict("This supplier has served bookings. Deactivate it instead so the history is kept.");
        }
        hotelRepository.findBySupplierIdOrderByNameAsc(id).forEach(hotelRepository::delete);
        vehicleRepository.findBySupplierIdOrderByModelAsc(id).forEach(vehicleRepository::delete);
        guideRepository.findBySupplierIdOrderByFullNameAsc(id).forEach(g -> g.setSupplier(null));
        userRepository.findBySupplierIdAndActiveTrue(id).forEach(u -> {
            u.setSupplier(null);
            u.setActive(false);
        });
        rateRepository.findBySupplierIdOrderByServiceNameAscVersionDesc(id).forEach(rateRepository::delete);
        contractRepository.findBySupplierIdOrderByVersionDesc(id).forEach(contractRepository::delete);
        supplierRepository.delete(s);
    }

    // ------------------------------------------------------------------ contracts (versioned)

    @Transactional(readOnly = true)
    public List<ContractResponse> contracts(Long supplierId) {
        find(supplierId);
        return contractRepository.findBySupplierIdOrderByVersionDesc(supplierId).stream().map(ContractResponse::from).toList();
    }

    /** Every change stores a new contract version; the previous active version is superseded. */
    public ContractResponse newContractVersion(Long supplierId, ContractRequest r, String actor) {
        Supplier s = find(supplierId);
        if (!r.endDate().isAfter(r.startDate())) {
            throw new BusinessException("The contract end date must be after the start date");
        }
        if (r.endDate().isBefore(LocalDate.now())) {
            throw new BusinessException("The contract end date is already in the past");
        }
        int version = contractRepository.findFirstBySupplierIdOrderByVersionDesc(supplierId).map(SupplierContract::getVersion).orElse(0) + 1;
        contractRepository.findFirstBySupplierIdAndStatus(supplierId, SupplierContract.Status.ACTIVE)
                .ifPresent(old -> old.setStatus(SupplierContract.Status.SUPERSEDED));
        SupplierContract c = new SupplierContract();
        c.setSupplier(s);
        c.setVersion(version);
        c.setStartDate(r.startDate());
        c.setEndDate(r.endDate());
        c.setCommissionPercent(r.commissionPercent());
        c.setPaymentTerms(r.paymentTerms());
        c.setTerms(r.terms().trim());
        c.setCreatedBy(actor);
        contractRepository.save(c);
        notificationService.notifySupplierUsers(supplierId, Notification.Type.RATE, "Contract updated (version " + version + ")",
                "Your agreement with Explore Lanka has new terms valid " + r.startDate() + " to " + r.endDate() + ".",
                "/admin/schedule.html");
        return ContractResponse.from(c);
    }

    // ------------------------------------------------------------------ service rates (UC-02)

    @Transactional(readOnly = true)
    public List<RateResponse> rates(Long supplierId) {
        find(supplierId);
        return rateRepository.findBySupplierIdOrderByServiceNameAscVersionDesc(supplierId).stream().map(RateResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RateResponse> pendingRates() {
        return rateRepository.findByStatusOrderByCreatedAtAsc(ServiceRate.Status.PENDING_APPROVAL).stream().map(RateResponse::from).toList();
    }

    /**
     * UC-02 step 4 "rate-change approval and versioning logic":
     *  - first rate for a service -> ACTIVE (version 1)
     *  - change of 20% or less   -> new ACTIVE version, previous version SUPERSEDED
     *  - change above 20%        -> new PENDING_APPROVAL version, current rate stays in force
     * Existing bookings keep their stored prices; only new bookings use the new rate (open issue decision).
     */
    public RateResponse proposeRate(Long supplierId, RateRequest r, String actor) {
        Supplier s = find(supplierId);
        if (s.getStatus() != Supplier.Status.ACTIVE) {
            throw new BusinessException("Reactivate the supplier before changing its rates");
        }
        if (r.effectiveFrom().isBefore(LocalDate.now())) {
            throw new BusinessException("The effective date cannot be in the past");
        }
        validateResourceLink(s, r.resourceType(), r.resourceId());
        String service = r.serviceName().trim();
        if (rateRepository.findFirstBySupplierIdAndServiceNameIgnoreCaseAndStatus(supplierId, service, ServiceRate.Status.PENDING_APPROVAL).isPresent()) {
            throw BusinessException.conflict("A change to \"" + service + "\" is already waiting for approval");
        }
        Optional<ServiceRate> current = rateRepository.findFirstBySupplierIdAndServiceNameIgnoreCaseAndStatus(supplierId, service, ServiceRate.Status.ACTIVE);
        int version = rateRepository.findFirstBySupplierIdAndServiceNameIgnoreCaseOrderByVersionDesc(supplierId, service)
                .map(ServiceRate::getVersion).orElse(0) + 1;

        ServiceRate rate = new ServiceRate();
        rate.setSupplier(s);
        rate.setServiceName(service);
        rate.setUnit(r.unit());
        rate.setAmount(r.amount().setScale(2, RoundingMode.HALF_UP));
        rate.setVersion(version);
        rate.setEffectiveFrom(r.effectiveFrom());
        rate.setResourceType(r.resourceType());
        rate.setResourceId(r.resourceId());
        rate.setRequestedBy(actor);

        if (current.isEmpty()) {
            rate.setStatus(ServiceRate.Status.ACTIVE);
            rateRepository.save(rate);
            applyToResource(rate);
            return RateResponse.from(rate);
        }
        ServiceRate old = current.get();
        if (old.getAmount().compareTo(rate.getAmount()) == 0 && old.getUnit() == rate.getUnit()) {
            throw new BusinessException("The new rate is the same as the current rate");
        }
        BigDecimal change = rate.getAmount().subtract(old.getAmount()).abs()
                .multiply(BigDecimal.valueOf(100)).divide(old.getAmount(), 2, RoundingMode.HALF_UP);
        rate.setPreviousAmount(old.getAmount());
        rate.setChangePercent(rate.getAmount().compareTo(old.getAmount()) >= 0 ? change : change.negate());
        if (change.compareTo(APPROVAL_THRESHOLD) > 0) {
            rate.setStatus(ServiceRate.Status.PENDING_APPROVAL);
            rateRepository.save(rate);
            notificationService.notifyRole(Role.SYSTEM_ADMIN, Notification.Type.RATE, "Rate change needs approval",
                    s.getName() + " - " + service + ": LKR " + old.getAmount().toPlainString() + " -> " + rate.getAmount().toPlainString()
                            + " (" + rate.getChangePercent().toPlainString() + "%)", "/admin/partners.html#approvals");
        } else {
            old.setStatus(ServiceRate.Status.SUPERSEDED);
            rate.setStatus(ServiceRate.Status.ACTIVE);
            rateRepository.save(rate);
            applyToResource(rate);
        }
        return RateResponse.from(rate);
    }

    /** Only the System Administrator approves or rejects large rate changes. */
    public RateResponse decide(Long rateId, boolean approve, String note, String actor) {
        ServiceRate rate = rateRepository.findById(rateId).orElseThrow(() -> new NotFoundException("Service rate", rateId));
        if (rate.getStatus() != ServiceRate.Status.PENDING_APPROVAL) {
            throw new BusinessException("This rate is not waiting for approval");
        }
        if (!approve && (note == null || note.isBlank())) {
            throw new BusinessException("Give a reason when rejecting a rate change");
        }
        rate.setDecidedBy(actor);
        rate.setDecidedAt(LocalDateTime.now());
        rate.setDecisionNote(note);
        if (approve) {
            rateRepository.findFirstBySupplierIdAndServiceNameIgnoreCaseAndStatus(rate.getSupplier().getId(), rate.getServiceName(), ServiceRate.Status.ACTIVE)
                    .ifPresent(old -> old.setStatus(ServiceRate.Status.SUPERSEDED));
            rate.setStatus(ServiceRate.Status.ACTIVE);
            applyToResource(rate);
        } else {
            rate.setStatus(ServiceRate.Status.REJECTED);
        }
        notificationService.notifyRole(Role.BUSINESS_MANAGER, Notification.Type.RATE,
                "Rate change " + (approve ? "approved" : "rejected"),
                rate.getSupplier().getName() + " - " + rate.getServiceName() + ": LKR " + rate.getAmount().toPlainString()
                        + (approve ? "" : ". Reason: " + note), "/admin/partners.html");
        notificationService.notifySupplierUsers(rate.getSupplier().getId(), Notification.Type.RATE,
                "Rate " + (approve ? "approved" : "not approved") + ": " + rate.getServiceName(),
                "LKR " + rate.getAmount().toPlainString() + " per " + rate.getUnit().name().replace("PER_", "").toLowerCase(Locale.ROOT)
                        + (approve ? " from " + rate.getEffectiveFrom() : ""), "/admin/schedule.html");
        return RateResponse.from(rate);
    }

    // ------------------------------------------------------------------ partner self-service

    @Transactional(readOnly = true)
    public PartnerAgreement agreementFor(User partner) {
        if (partner.getSupplier() == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Your account is not linked to a supplier");
        }
        Supplier s = find(partner.getSupplier().getId());
        SupplierContract c = contractRepository.findFirstBySupplierIdAndStatus(s.getId(), SupplierContract.Status.ACTIVE).orElse(null);
        List<RateResponse> rates = rateRepository.findBySupplierIdOrderByServiceNameAscVersionDesc(s.getId()).stream()
                .filter(r -> r.getStatus() == ServiceRate.Status.ACTIVE || r.getStatus() == ServiceRate.Status.PENDING_APPROVAL)
                .map(RateResponse::from).toList();
        return new PartnerAgreement(toResponse(s, performance()), c == null ? null : ContractResponse.from(c), rates);
    }

    // ------------------------------------------------------------------ performance tracking

    /** Per-supplier ratings (from post-tour feedback), allocations and revenue. */
    public record Performance(Map<Long, double[]> ratings, Map<Long, Long> allocations, Map<Long, BigDecimal> revenue) {
    }

    @Transactional(readOnly = true)
    public Performance performance() {
        Map<Long, Long> supplierOfHotel = new HashMap<>();
        Map<Long, Long> supplierOfVehicle = new HashMap<>();
        Map<Long, Long> supplierOfGuide = new HashMap<>();
        hotelRepository.findAll().forEach(h -> { if (h.getSupplier() != null) supplierOfHotel.put(h.getId(), h.getSupplier().getId()); });
        vehicleRepository.findAll().forEach(v -> { if (v.getSupplier() != null) supplierOfVehicle.put(v.getId(), v.getSupplier().getId()); });
        guideRepository.findAll().forEach(g -> { if (g.getSupplier() != null) supplierOfGuide.put(g.getId(), g.getSupplier().getId()); });

        Map<Long, Long> allocations = new HashMap<>();
        Map<Long, BigDecimal> revenue = new HashMap<>();
        Map<Long, List<ResourceAllocation>> byBooking = new HashMap<>();
        for (ResourceAllocation a : allocationRepository.findByStatus(ResourceAllocation.Status.ALLOCATED)) {
            Long sid = supplierFor(a, supplierOfHotel, supplierOfVehicle, supplierOfGuide);
            byBooking.computeIfAbsent(a.getBooking().getId(), k -> new ArrayList<>()).add(a);
            if (sid == null) {
                continue;
            }
            allocations.merge(sid, 1L, Long::sum);
            Booking b = a.getBooking();
            if (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED) {
                BigDecimal amount = switch (a.getResourceType()) {
                    case HOTEL -> b.getAccommodationCost();
                    case VEHICLE -> b.getTransportCost();
                    case GUIDE -> b.getGuideCost();
                };
                revenue.merge(sid, amount, BigDecimal::add);
            }
        }
        // ratings: [sum, count]
        Map<Long, double[]> ratings = new HashMap<>();
        for (Feedback f : feedbackRepository.findAll()) {
            for (ResourceAllocation a : byBooking.getOrDefault(f.getBooking().getId(), List.of())) {
                Integer stars = switch (a.getResourceType()) {
                    case HOTEL -> f.getHotelRating();
                    case VEHICLE -> f.getTransportRating();
                    case GUIDE -> f.getGuideRating();
                };
                Long sid = supplierFor(a, supplierOfHotel, supplierOfVehicle, supplierOfGuide);
                if (stars != null && sid != null) {
                    double[] acc = ratings.computeIfAbsent(sid, k -> new double[2]);
                    acc[0] += stars;
                    acc[1] += 1;
                }
            }
        }
        return new Performance(ratings, allocations, revenue);
    }

    // ------------------------------------------------------------------ helpers

    private static Long supplierFor(ResourceAllocation a, Map<Long, Long> hotels, Map<Long, Long> vehicles, Map<Long, Long> guides) {
        return switch (a.getResourceType()) {
            case HOTEL -> hotels.get(a.getResourceId());
            case VEHICLE -> vehicles.get(a.getResourceId());
            case GUIDE -> guides.get(a.getResourceId());
        };
    }

    private void validateResourceLink(Supplier s, ResourceType type, Long resourceId) {
        if (type == null && resourceId == null) {
            return;
        }
        if (type == null || resourceId == null) {
            throw new BusinessException("Choose both the resource type and the resource, or neither");
        }
        Supplier owner = switch (type) {
            case HOTEL -> hotelRepository.findById(resourceId).map(Hotel::getSupplier).orElseThrow(() -> new NotFoundException("Hotel", resourceId));
            case VEHICLE -> vehicleRepository.findById(resourceId).map(Vehicle::getSupplier).orElseThrow(() -> new NotFoundException("Vehicle", resourceId));
            case GUIDE -> guideRepository.findById(resourceId).map(TourGuide::getSupplier).orElseThrow(() -> new NotFoundException("Tour guide", resourceId));
        };
        if (owner == null || !owner.getId().equals(s.getId())) {
            throw new BusinessException("That resource does not belong to " + s.getName());
        }
    }

    /** An active rate linked to a resource updates the resource's price for new bookings. */
    private void applyToResource(ServiceRate rate) {
        if (rate.getResourceType() == null || rate.getResourceId() == null || rate.getEffectiveFrom().isAfter(LocalDate.now())) {
            return;
        }
        switch (rate.getResourceType()) {
            case HOTEL -> hotelRepository.findById(rate.getResourceId()).ifPresent(h -> h.setPricePerNight(rate.getAmount()));
            case VEHICLE -> vehicleRepository.findById(rate.getResourceId()).ifPresent(v -> v.setPricePerDay(rate.getAmount()));
            case GUIDE -> guideRepository.findById(rate.getResourceId()).ifPresent(g -> g.setPricePerDay(rate.getAmount()));
        }
    }

    private ResourceType resourceType(Supplier s) {
        return switch (s.getType()) {
            case HOTEL -> ResourceType.HOTEL;
            case TRANSPORT -> ResourceType.VEHICLE;
            case TOUR_GUIDE -> ResourceType.GUIDE;
        };
    }

    private List<Long> resourceIds(Supplier s) {
        return switch (s.getType()) {
            case HOTEL -> hotelRepository.findBySupplierIdOrderByNameAsc(s.getId()).stream().map(Hotel::getId).toList();
            case TRANSPORT -> vehicleRepository.findBySupplierIdOrderByModelAsc(s.getId()).stream().map(Vehicle::getId).toList();
            case TOUR_GUIDE -> guideRepository.findBySupplierIdOrderByFullNameAsc(s.getId()).stream().map(TourGuide::getId).toList();
        };
    }

    private SupplierResponse toResponse(Supplier s, Performance perf) {
        SupplierContract c = contractRepository.findFirstBySupplierIdAndStatus(s.getId(), SupplierContract.Status.ACTIVE).orElse(null);
        double[] r = perf.ratings().getOrDefault(s.getId(), new double[2]);
        double avg = r[1] == 0 ? 0 : Math.round(r[0] / r[1] * 10) / 10.0;
        long pending = rateRepository.findBySupplierIdOrderByServiceNameAscVersionDesc(s.getId()).stream()
                .filter(x -> x.getStatus() == ServiceRate.Status.PENDING_APPROVAL).count();
        return new SupplierResponse(s.getId(), s.getName(), s.getType(), s.getContactPerson(), s.getEmail(), s.getPhone(),
                s.getAddress(), s.getStatus(), s.getNotes(), resourceIds(s).size(),
                c == null ? null : c.getVersion(), c == null ? null : c.getEndDate(), c == null ? null : c.getCommissionPercent(),
                avg, (long) r[1], perf.allocations().getOrDefault(s.getId(), 0L),
                perf.revenue().getOrDefault(s.getId(), BigDecimal.ZERO), pending);
    }

    private Supplier find(Long id) {
        return supplierRepository.findById(id).orElseThrow(() -> new NotFoundException("Supplier", id));
    }
}
