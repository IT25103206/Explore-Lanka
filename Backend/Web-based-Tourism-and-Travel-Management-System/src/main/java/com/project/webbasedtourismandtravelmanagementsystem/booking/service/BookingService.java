package com.project.webbasedtourismandtravelmanagementsystem.booking.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.booking.observer.BookingStatusChangedEvent;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.ItineraryRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventFestivalRepository;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Refund;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.PaymentRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.RefundRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.RefundService;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.service.PromotionService;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.AllocationResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.ResourceOption;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.HotelRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.TourGuideRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.VehicleRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.AllocationService;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.AvailabilityService;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.CustomPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.PackageItineraryDay;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.SeasonalPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.*;

/**
 * Smart Booking & Reservation Management (IT25100080 Rodrigo K.Y.S) - UC-06 Book Tour Package.
 * BookingController / CentralBookingSystem roles from the "Book Tour Package" sequence diagram.
 */
@Service
@Transactional
public class BookingService {

    /** Tours must be booked at least this many days ahead so resources can be arranged. */
    public static final int MIN_LEAD_DAYS = 2;
    private static final int MAX_GUESTS_PER_ROOM = 3;

    public record BookingFilter(BookingStatus status, String q, LocalDate from, LocalDate to) {
    }

    /** Result of pricing a booking request, with the resolved entities. */
    private record Computed(QuoteResponse quote, TourPackage tourPackage, Hotel hotel, Vehicle vehicle, Promotion promotion) {
    }

    private final SecureRandom random = new SecureRandom();

    private final BookingRepository bookingRepository;
    private final ItineraryRepository itineraryRepository;
    private final TourPackageService packageService;
    private final HotelRepository hotelRepository;
    private final VehicleRepository vehicleRepository;
    private final TourGuideRepository guideRepository;
    private final AvailabilityService availability;
    private final AllocationService allocationService;
    private final PromotionService promotionService;
    private final RefundService refundService;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final FeedbackRepository feedbackRepository;
    private final EventFestivalRepository eventRepository;
    private final ApplicationEventPublisher events;

    public BookingService(BookingRepository bookingRepository, ItineraryRepository itineraryRepository,
                          TourPackageService packageService, HotelRepository hotelRepository,
                          VehicleRepository vehicleRepository, TourGuideRepository guideRepository,
                          AvailabilityService availability, AllocationService allocationService,
                          PromotionService promotionService, RefundService refundService,
                          PaymentRepository paymentRepository, RefundRepository refundRepository,
                          FeedbackRepository feedbackRepository, EventFestivalRepository eventRepository,
                          ApplicationEventPublisher events) {
        this.bookingRepository = bookingRepository;
        this.itineraryRepository = itineraryRepository;
        this.packageService = packageService;
        this.hotelRepository = hotelRepository;
        this.vehicleRepository = vehicleRepository;
        this.guideRepository = guideRepository;
        this.availability = availability;
        this.allocationService = allocationService;
        this.promotionService = promotionService;
        this.refundService = refundService;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.feedbackRepository = feedbackRepository;
        this.eventRepository = eventRepository;
        this.events = events;
    }

    // ================================================================== UC-06 steps 2-6

    /** Hotels, vehicles and guide availability for the chosen package and date (preference selection, PBI-02). */
    @Transactional(readOnly = true)
    public BookingOptions options(Long packageId, LocalDate startDate, int adults, int children, int extraDays, String guideLanguage) {
        TourPackage p = bookablePackage(packageId);
        validateDate(p, startDate);
        int travellers = Math.max(1, adults) + Math.max(0, children);
        int days = p.getDurationDays() + Math.max(0, Math.min(extraDays, p.maxExtraDays()));
        LocalDate end = startDate.plusDays(days - 1L);
        int nights = days - 1;
        int rooms = nights == 0 ? 0 : suggestedRooms(travellers);
        List<String> warnings = new ArrayList<>();
        List<ResourceOption> hotels = nights == 0 ? List.of()
                : availability.hotelOptions(p.destinationList(), startDate, end, Math.max(1, rooms));
        List<ResourceOption> vehicles = availability.vehicleOptions(travellers, startDate, end, null);
        Optional<TourGuide> guide = availability.cheapestAvailableGuide(guideLanguage, startDate, end);
        if (nights > 0 && hotels.stream().noneMatch(ResourceOption::available)) {
            warnings.add("No hotels have enough rooms on these dates - please try different dates (4a)");
        } else if (nights > 0 && hotels.stream().filter(ResourceOption::available).allMatch(ResourceOption::alternative)) {
            warnings.add("Hotels in the tour area are full; hotels in nearby towns are shown instead");
        }
        if (vehicles.stream().noneMatch(ResourceOption::available)) {
            warnings.add("No vehicle for " + travellers + " passengers is free on these dates - you can still book and arrange your own transport");
        }
        if (travellers > p.getMaxGroupSize()) {
            warnings.add("This package allows at most " + p.getMaxGroupSize() + " travellers");
        }
        BigDecimal guideRate = guide.map(TourGuide::getPricePerDay)
                .orElseGet(() -> guideRepository.findByActiveTrueOrderByPricePerDayAsc().stream().findFirst()
                        .map(TourGuide::getPricePerDay).orElse(BigDecimal.ZERO));
        return new BookingOptions(p.getId(), p.getName(), p.getPackageType(), startDate, end, nights, days,
                p.getMaxGroupSize(), p.maxExtraDays(), rooms, hotels, vehicles, guide.isPresent(), guideRate, warnings);
    }

    /** Booking summary and total cost. A wrong promo code does not fail the quote - it is explained instead. */
    public QuoteResponse quote(BookingRequest r, User customer) {
        return compute(r, customer, true).quote();
    }

    /** UC-06 step 7-8 (before payment): stores the reservation as PENDING_PAYMENT. */
    public BookingResponse create(BookingRequest r, User customer) {
        Computed c = compute(r, customer, false);
        QuoteResponse q = c.quote();
        ensureBookable(r, q);
        List<TravelerDetail> travellers = travellers(r.travelers(), r.adults(), r.children());

        Booking b = new Booking();
        b.setReference(newReference());
        b.setCustomer(customer);
        b.setStatus(BookingStatus.PENDING_PAYMENT);
        copy(b, r, c);
        b.replaceTravelers(travellers);
        bookingRepository.save(b);
        events.publishEvent(new BookingStatusChangedEvent(b.getId(), null, BookingStatus.PENDING_PAYMENT, null));
        return toResponse(b, false);
    }

    // ================================================================== customer views

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(User customer) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).stream()
                .map(b -> toResponse(b, false)).toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse myBooking(Long id, User customer) {
        return toResponse(owned(id, customer), false);
    }

    // ================================================================== modify / cancel (PBI-06)

    /** Unpaid bookings can change everything (re-priced and re-checked). */
    public BookingResponse modifyPending(Long id, BookingRequest r, User customer) {
        Booking b = owned(id, customer);
        requireWindow(b);
        if (b.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new BusinessException("Confirmed bookings can only change traveller details and special requests. To change dates or options, cancel and book again.");
        }
        if (!b.getTourPackage().getId().equals(r.packageId())) {
            throw new BusinessException("The tour package of a booking cannot be changed - make a new booking instead");
        }
        Computed c = compute(r, customer, false);
        ensureBookable(r, c.quote());
        List<TravelerDetail> travellers = travellers(r.travelers(), r.adults(), r.children());
        copy(b, r, c);
        b.replaceTravelers(travellers);
        events.publishEvent(new BookingStatusChangedEvent(b.getId(), b.getStatus(), b.getStatus(),
                "New total: LKR " + b.getTotalAmount().toPlainString()));
        return toResponse(b, false);
    }

    /** Paid / confirmed bookings: traveller details and special requests only (UC-06 decision). */
    public BookingResponse updateTravellers(Long id, TravellerUpdateRequest r, User customer) {
        Booking b = owned(id, customer);
        if (!b.getStatus().isActive()) {
            throw new BusinessException("This booking is " + b.getStatus().name().toLowerCase(Locale.ROOT) + " and can no longer be changed");
        }
        requireWindow(b);
        b.replaceTravelers(travellers(r.travelers(), b.getAdults(), b.getChildren()));
        b.setSpecialRequests(blankToNull(r.specialRequests()));
        events.publishEvent(new BookingStatusChangedEvent(b.getId(), b.getStatus(), b.getStatus(),
                "Traveller details and special requests were updated."));
        return toResponse(b, false);
    }

    public BookingResponse cancelByCustomer(Long id, String reason, User customer) {
        Booking b = owned(id, customer);
        if (!b.getStatus().isActive()) {
            throw new BusinessException("This booking is already " + b.getStatus().name().toLowerCase(Locale.ROOT));
        }
        requireWindow(b);
        cancel(b, reason, "customer");
        return toResponse(b, false);
    }

    // ================================================================== staff (Finance & Booking Coordinator, Ops)

    @Transactional(readOnly = true)
    public List<BookingResponse> list(BookingFilter f) {
        String q = f.q() == null ? "" : f.q().trim().toLowerCase(Locale.ROOT);
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(b -> f.status() == null || b.getStatus() == f.status())
                .filter(b -> f.from() == null || !b.getStartDate().isBefore(f.from()))
                .filter(b -> f.to() == null || !b.getStartDate().isAfter(f.to()))
                .filter(b -> q.isEmpty() || (b.getReference() + " " + b.getCustomer().getFullName() + " "
                        + b.getCustomer().getEmail() + " " + b.getTourPackage().getName()).toLowerCase(Locale.ROOT).contains(q))
                .map(b -> toResponse(b, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse get(Long id) {
        return toResponse(find(id), true);
    }

    public BookingResponse cancelByStaff(Long id, String reason, String actor) {
        Booking b = find(id);
        if (!b.getStatus().isActive()) {
            throw new BusinessException("This booking is already " + b.getStatus().name().toLowerCase(Locale.ROOT));
        }
        cancel(b, reason, actor);
        return toResponse(b, true);
    }

    public BookingResponse completeByStaff(Long id) {
        Booking b = find(id);
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Only confirmed bookings can be marked as completed");
        }
        if (b.getEndDate().isAfter(LocalDate.now())) {
            throw new BusinessException("This tour has not finished yet (ends " + b.getEndDate() + ")");
        }
        changeStatus(b, BookingStatus.COMPLETED, null);
        return toResponse(b, true);
    }

    // ================================================================== payment callbacks (used by PaymentService)

    /** Payment succeeded: confirm, count the promotion, allocate resources, generate the itinerary. */
    public void confirmAfterPayment(Booking b) {
        b.setConfirmedAt(java.time.LocalDateTime.now());
        promotionService.markUsed(b.getPromotion());
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.CONFIRMED);
        allocationService.autoAllocate(b);
        generateItinerary(b);
        events.publishEvent(new BookingStatusChangedEvent(b.getId(), old, BookingStatus.CONFIRMED, null));
    }

    public void markAwaitingVerification(Booking b) {
        changeStatus(b, BookingStatus.AWAITING_VERIFICATION, null);
    }

    public void revertToPendingPayment(Booking b, String reason) {
        changeStatus(b, BookingStatus.PENDING_PAYMENT, "Your bank transfer could not be verified: " + reason + ". Please pay again.");
    }

    /** Re-checks that the chosen hotel / vehicle / guide are still free just before charging. */
    @Transactional(readOnly = true)
    public List<String> availabilityIssues(Booking b) {
        List<String> issues = new ArrayList<>();
        if (b.nights() > 0 && b.getPreferredHotel() != null) {
            issues.addAll(availability.hotelConflicts(b.getPreferredHotel(), b.getStartDate(), b.getEndDate(), b.getRooms()));
        }
        if (b.getPreferredVehicle() != null) {
            issues.addAll(availability.vehicleConflicts(b.getPreferredVehicle(), b.getStartDate(), b.getEndDate(), b.getId()));
        }
        if (b.isGuideRequired() && availability.cheapestAvailableGuide(b.getGuideLanguage(), b.getStartDate(), b.getEndDate()).isEmpty()) {
            issues.add("No tour guide is free on these dates any more");
        }
        return issues;
    }

    // ================================================================== nightly job

    public int completeFinishedTours() {
        List<Booking> finished = bookingRepository.findByStatusAndEndDateBefore(BookingStatus.CONFIRMED, LocalDate.now());
        finished.forEach(b -> changeStatus(b, BookingStatus.COMPLETED, null));
        return finished.size();
    }

    /** Unpaid bookings whose travel date has arrived are cancelled automatically. */
    public int cancelUnpaidPastDeadline() {
        List<Booking> stale = bookingRepository.findByStatusOrderByStartDateAsc(BookingStatus.PENDING_PAYMENT).stream()
                .filter(b -> !b.getStartDate().isAfter(LocalDate.now()))
                .toList();
        stale.forEach(b -> cancel(b, "Not paid before the travel date", "System"));
        return stale.size();
    }

    // ================================================================== itinerary ("generate travel plans")

    @Transactional(readOnly = true)
    public ItineraryResponse itinerary(Long bookingId, User viewer) {
        Booking b = find(bookingId);
        boolean allowed = viewer.getRole().isStaff()
                || b.getCustomer().getId().equals(viewer.getId())
                || (viewer.getRole().isPartner() && isAssignedPartner(b, viewer));
        if (!allowed) {
            throw new NotFoundException("Booking", bookingId);
        }
        Itinerary it = itineraryRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BusinessException("The itinerary is generated once the booking is confirmed"));
        List<String> resources = allocationService.current(bookingId).stream()
                .map(a -> a.resourceType() + ": " + a.resourceName()).toList();
        return new ItineraryResponse(b.getId(), b.getReference(), b.getTourPackage().getName(), b.getStartDate(),
                b.getEndDate(), resources, it.getItems().stream().map(ItineraryItemDto::from).toList());
    }

    public void generateItinerary(Booking b) {
        Itinerary it = itineraryRepository.findByBookingId(b.getId()).orElseGet(() -> new Itinerary(b));
        it.getItems().clear();
        TourPackage p = b.getTourPackage();
        int totalDays = b.nights() + 1;
        Map<Integer, PackageItineraryDay> plan = new HashMap<>();
        p.getItineraryDays().forEach(d -> plan.put(d.getDayNumber(), d));
        for (int day = 1; day <= totalDays; day++) {
            LocalDate date = b.getStartDate().plusDays(day - 1L);
            PackageItineraryDay d = plan.get(day);
            if (d != null) {
                it.addItem(new ItineraryItem(day, date, ItineraryItem.Type.ACTIVITY, d.getTitle(), d.getDescription(),
                        d.getLocation(), d.getRoute(), "Package plan"));
            } else if (day > p.getDurationDays()) {
                it.addItem(new ItineraryItem(day, date, ItineraryItem.Type.ACTIVITY, "Extended stay - free day",
                        "Relax or explore at your own pace. Ask your guide for suggestions.", null, null, "Package plan"));
            } else {
                it.addItem(new ItineraryItem(day, date, ItineraryItem.Type.ACTIVITY, "Day " + day + " - " + p.getName(),
                        null, null, null, "Package plan"));
            }
        }
        // festivals and events in the tour region during the trip (links the event module to bookings)
        for (EventFestival e : eventRepository.findByStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(EventFestival.Status.PUBLISHED, b.getStartDate())) {
            boolean overlaps = !e.getStartDate().isAfter(b.getEndDate());
            boolean linked = e.getLinkedPackages().stream().anyMatch(x -> x.getId().equals(p.getId()));
            if (overlaps && (linked || e.getRegion().equalsIgnoreCase(p.getRegion()))) {
                LocalDate date = e.getStartDate().isBefore(b.getStartDate()) ? b.getStartDate() : e.getStartDate();
                int day = (int) java.time.temporal.ChronoUnit.DAYS.between(b.getStartDate(), date) + 1;
                it.addItem(new ItineraryItem(day, date, ItineraryItem.Type.EVENT, "Optional: " + e.getName(),
                        e.getStartTime() + " - " + e.getEndTime() + (e.getDressCode() == null ? "" : ". Dress code: " + e.getDressCode()),
                        e.getLocation(), null, "Event calendar"));
            }
        }
        itineraryRepository.save(it);
    }

    // ================================================================== internals

    private Computed compute(BookingRequest r, User customer, boolean countPromoEngagement) {
        TourPackage p = bookablePackage(r.packageId());
        validateDate(p, r.startDate());
        int travellers = r.adults() + r.children();
        if (travellers > p.getMaxGroupSize()) {
            throw new BusinessException("This package allows at most " + p.getMaxGroupSize() + " travellers per booking");
        }
        if (r.extraDays() > p.maxExtraDays()) {
            throw new BusinessException(p.maxExtraDays() == 0
                    ? "Only customisable packages can be extended with extra days"
                    : "This package can be extended by at most " + p.maxExtraDays() + " day(s)");
        }
        int days = p.getDurationDays() + r.extraDays();
        int nights = days - 1;
        LocalDate end = r.startDate().plusDays(days - 1L);

        // accommodation preference
        Hotel hotel = null;
        int rooms = 0;
        if (nights > 0) {
            if (r.hotelId() == null) {
                throw new BusinessException("Choose your accommodation");
            }
            hotel = hotelRepository.findById(r.hotelId()).orElseThrow(() -> new NotFoundException("Hotel", r.hotelId()));
            rooms = r.rooms() == 0 ? suggestedRooms(travellers) : r.rooms();
            if (rooms * MAX_GUESTS_PER_ROOM < travellers) {
                throw new BusinessException(travellers + " travellers need at least " + suggestedMinRooms(travellers) + " room(s) (max 3 guests per room)");
            }
            if (rooms > travellers) {
                throw new BusinessException("You cannot book more rooms than travellers");
            }
        }
        // transport preference - optional: tourists may arrange their own transport
        Vehicle vehicle = null;
        if (r.vehicleId() != null) {
            vehicle = vehicleRepository.findById(r.vehicleId()).orElseThrow(() -> new NotFoundException("Vehicle", r.vehicleId()));
            if (vehicle.getSeats() < travellers) {
                throw new BusinessException(vehicle.label() + " cannot carry " + travellers + " travellers - choose a larger vehicle");
            }
        }

        // step 4: real-time availability
        List<String> issues = new ArrayList<>();
        if (hotel != null) {
            issues.addAll(availability.hotelConflicts(hotel, r.startDate(), end, rooms));
        }
        if (vehicle != null) {
            issues.addAll(availability.vehicleConflicts(vehicle, r.startDate(), end, null));
        }
        BigDecimal guideRate = BigDecimal.ZERO;
        if (r.guideRequired()) {
            Optional<TourGuide> guide = availability.cheapestAvailableGuide(r.guideLanguage(), r.startDate(), end);
            if (guide.isEmpty()) {
                issues.add("No tour guide is available on these dates");
            }
            guideRate = guide.map(TourGuide::getPricePerDay)
                    .orElseGet(() -> guideRepository.findByActiveTrueOrderByPricePerDayAsc().stream().findFirst()
                            .map(TourGuide::getPricePerDay).orElse(BigDecimal.ZERO));
        }

        // step 5: total cost (CalculateFinalPrice + resource costs)
        BigDecimal adultPrice = p.pricePerAdult(r.startDate());
        BigDecimal packageCost = p.packageCost(r.startDate(), r.adults(), r.children(), r.extraDays());
        BigDecimal accommodation = hotel == null ? BigDecimal.ZERO
                : hotel.getPricePerNight().multiply(BigDecimal.valueOf((long) rooms * nights));
        BigDecimal transport = vehicle == null ? BigDecimal.ZERO : vehicle.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal guideCost = guideRate.multiply(BigDecimal.valueOf(r.guideRequired() ? days : 0));
        BigDecimal subtotal = packageCost.add(accommodation).add(transport).add(guideCost).setScale(2, RoundingMode.HALF_UP);

        // extension 3a: promotion code
        Promotion promotion = null;
        BigDecimal discount = BigDecimal.ZERO;
        String promoTitle = null;
        String promoMessage = null;
        String code = blankToNull(r.promoCode());
        if (code != null) {
            try {
                PromotionService.AppliedPromotion applied = promotionService.apply(code, p, subtotal, customer,
                        r.adults(), r.children(), countPromoEngagement);
                promotion = applied.promotion();
                discount = applied.discount();
                promoTitle = promotion.getTitle();
                promoMessage = String.format("Code applied: you save LKR %,d", discount.setScale(0, RoundingMode.HALF_UP).longValue());
            } catch (BusinessException e) {
                promoMessage = e.getMessage();
            }
        }
        BigDecimal total = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);

        String note = null;
        if (p instanceof SeasonalPackage s && s.inSeason(r.startDate())) {
            note = s.getSeasonName() + " pricing applied (" + s.getSeasonalAdjustmentPercent().stripTrailingZeros().toPlainString() + "%)";
        } else if (p instanceof CustomPackage && r.extraDays() > 0) {
            note = "Includes " + r.extraDays() + " extra day(s) on your custom plan";
        }

        QuoteResponse quote = new QuoteResponse(p.getId(), p.getName(), r.startDate(), end, nights, days, r.adults(),
                r.children(), r.extraDays(), rooms,
                hotel == null ? null : hotel.getId(), hotel == null ? null : hotel.getName(), hotel == null ? null : hotel.getPricePerNight(),
                vehicle == null ? null : vehicle.getId(), vehicle == null ? null : vehicle.label(),
                vehicle == null ? null : vehicle.getPricePerDay(), r.guideRequired(), guideRate,
                adultPrice, packageCost, accommodation, transport, guideCost, subtotal, discount, total,
                code == null ? null : code.toUpperCase(Locale.ROOT), promoTitle, promotion != null, promoMessage, note,
                issues.isEmpty(), issues);
        return new Computed(quote, p, hotel, vehicle, promotion);
    }

    private void ensureBookable(BookingRequest r, QuoteResponse q) {
        if (!q.available()) {
            throw BusinessException.conflict("Some of your selections are not available for these dates. Please choose alternative dates or options.", q.availabilityIssues());
        }
        if (blankToNull(r.promoCode()) != null && !q.promoApplied()) {
            throw new BusinessException(q.promoMessage() + ". Remove the code or use a different one.");
        }
    }

    private void copy(Booking b, BookingRequest r, Computed c) {
        QuoteResponse q = c.quote();
        b.setTourPackage(c.tourPackage());
        b.setStartDate(q.startDate());
        b.setEndDate(q.endDate());
        b.setAdults(r.adults());
        b.setChildren(r.children());
        b.setExtraDays(r.extraDays());
        b.setRooms(q.rooms());
        b.setPreferredHotel(c.hotel());
        b.setPreferredVehicle(c.vehicle());
        b.setGuideRequired(r.guideRequired());
        b.setGuideLanguage(r.guideRequired() ? blankToNull(r.guideLanguage()) : null);
        b.setSpecialRequests(blankToNull(r.specialRequests()));
        b.setPackageCost(q.packageCost());
        b.setAccommodationCost(q.accommodationCost());
        b.setTransportCost(q.transportCost());
        b.setGuideCost(q.guideCost());
        b.setSubtotal(q.subtotal());
        b.setDiscountAmount(q.discount());
        b.setTotalAmount(q.total());
        b.setPromotion(c.promotion());
        b.setPromoCode(c.promotion() == null ? null : c.promotion().getCouponCode());
    }

    private List<TravelerDetail> travellers(List<TravelerDto> list, int adults, int children) {
        if (list == null || list.size() != adults + children) {
            throw new BusinessException("Enter details for all " + (adults + children) + " traveller(s)");
        }
        long adultCount = list.stream().filter(t -> t.type() == TravelerDetail.Type.ADULT).count();
        if (adultCount != adults) {
            throw new BusinessException("Traveller details must include exactly " + adults + " adult(s) and " + children + " child(ren)");
        }
        for (TravelerDto t : list) {
            if (t.type() == TravelerDetail.Type.CHILD && t.age() >= 12) {
                throw new BusinessException(t.fullName() + " is " + t.age() + " - travellers aged 12 or over are adults");
            }
            if (t.type() == TravelerDetail.Type.ADULT && t.age() < 12) {
                throw new BusinessException(t.fullName() + " is under 12 - please add them as a child");
            }
        }
        return list.stream().map(t -> new TravelerDetail(t.fullName().trim(), t.type(), t.age(),
                blankToNull(t.nationality()), blankToNull(t.passportOrNic()) == null ? null : t.passportOrNic().trim().toUpperCase(Locale.ROOT))).toList();
    }

    private void cancel(Booking b, String reason, String by) {
        BookingStatus old = b.getStatus();
        allocationService.releaseAll(b);
        String note = "Reason: " + reason + ".";
        Optional<Payment> paid = refundService.successfulPayment(b.getId());
        if (paid.isPresent()) {
            refundService.requestRefund(b, paid.get(), reason);
            note += " A refund of LKR " + paid.get().getAmount().toPlainString() + " has been requested and will be processed by our finance team.";
        }
        paymentRepository.findByBookingIdOrderByCreatedAtDesc(b.getId()).stream()
                .filter(pm -> pm.getStatus() == Payment.Status.PENDING)
                .forEach(pm -> {
                    pm.setStatus(Payment.Status.FAILED);
                    pm.setFailureReason("Booking cancelled before the transfer was verified");
                });
        b.setStatus(BookingStatus.CANCELLED);
        b.setCancelledAt(java.time.LocalDateTime.now());
        b.setCancellationReason(reason + " (cancelled by " + by + ")");
        events.publishEvent(new BookingStatusChangedEvent(b.getId(), old, BookingStatus.CANCELLED, note));
    }

    private void changeStatus(Booking b, BookingStatus to, String note) {
        BookingStatus old = b.getStatus();
        b.setStatus(to);
        events.publishEvent(new BookingStatusChangedEvent(b.getId(), old, to, note));
    }

    private BookingResponse toResponse(Booking b, boolean staffView) {
        List<AllocationResponse> allocations = allocationService.current(b.getId());
        List<String> missing = b.getStatus() == BookingStatus.CONFIRMED ? allocationService.missing(b) : List.of();
        BigDecimal paid = paymentRepository.findByBookingIdOrderByCreatedAtDesc(b.getId()).stream()
                .filter(pm -> pm.getStatus() == Payment.Status.SUCCESS || pm.getStatus() == Payment.Status.REFUNDED)
                .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        String refund = refundRepository.findByBookingIdOrderByCreatedAtDesc(b.getId()).stream()
                .findFirst().map(Refund::getStatus).map(Enum::name).orElse(null);
        boolean hasFeedback = feedbackRepository.existsByBookingId(b.getId());
        boolean window = b.withinChangeWindow();
        boolean active = b.getStatus().isActive();
        return new BookingResponse(b.getId(), b.getReference(), b.getStatus(), b.getTourPackage().getId(),
                b.getTourPackage().getName(), b.getTourPackage().getImageUrl(), b.getTourPackage().getPackageType(),
                b.getTourPackage().getRegion(), b.getStartDate(), b.getEndDate(), b.nights(), b.getAdults(), b.getChildren(),
                b.getExtraDays(), b.getRooms(),
                b.getPreferredHotel() == null ? null : b.getPreferredHotel().getId(),
                b.getPreferredHotel() == null ? null : b.getPreferredHotel().getName(),
                b.getPreferredVehicle() == null ? null : b.getPreferredVehicle().getId(),
                b.getPreferredVehicle() == null ? null : b.getPreferredVehicle().label(),
                b.isGuideRequired(), b.getGuideLanguage(), b.getSpecialRequests(), b.getPackageCost(),
                b.getAccommodationCost(), b.getTransportCost(), b.getGuideCost(), b.getSubtotal(), b.getDiscountAmount(),
                b.getTotalAmount(), b.getPromoCode(), b.getCreatedAt(), b.getConfirmedAt(), b.getCancelledAt(),
                b.getCancellationReason(), b.getCustomer().getId(), b.getCustomer().getFullName(), b.getCustomer().getEmail(),
                b.getCustomer().getPhone(),
                b.getTravelers().stream().map(t -> staffView ? TravelerDto.masked(t) : TravelerDto.from(t)).toList(),
                allocations, missing, b.daysUntilTravel(),
                active && window, active && window && b.getStatus() == BookingStatus.PENDING_PAYMENT,
                active && window, b.getStatus() == BookingStatus.PENDING_PAYMENT,
                b.getStatus() == BookingStatus.COMPLETED && !hasFeedback, hasFeedback, paid, refund);
    }

    private boolean isAssignedPartner(Booking b, User partner) {
        List<AllocationResponse> current = allocationService.current(b.getId());
        if (partner.getRole() == Role.TOUR_GUIDE) {
            return guideRepository.findByUserId(partner.getId())
                    .map(g -> current.stream().anyMatch(a -> a.resourceType() == ResourceType.GUIDE && a.resourceId().equals(g.getId())))
                    .orElse(false);
        }
        Long supplierId = partner.getSupplier() == null ? null : partner.getSupplier().getId();
        if (supplierId == null) {
            return false;
        }
        return current.stream().anyMatch(a -> switch (a.resourceType()) {
            case HOTEL -> hotelRepository.findById(a.resourceId()).map(h -> h.getSupplier() != null && h.getSupplier().getId().equals(supplierId)).orElse(false);
            case VEHICLE -> vehicleRepository.findById(a.resourceId()).map(v -> v.getSupplier() != null && v.getSupplier().getId().equals(supplierId)).orElse(false);
            case GUIDE -> false;
        });
    }

    private TourPackage bookablePackage(Long id) {
        TourPackage p = packageService.find(id);
        if (!p.isBookable()) {
            throw new BusinessException("This tour package is not available for booking");
        }
        return p;
    }

    private void validateDate(TourPackage p, LocalDate start) {
        if (start == null) {
            throw new BusinessException("Choose a travel date");
        }
        if (start.isBefore(LocalDate.now().plusDays(MIN_LEAD_DAYS))) {
            throw new BusinessException("Tours must be booked at least " + MIN_LEAD_DAYS + " days before the travel date");
        }
        if (start.isBefore(p.getAvailableFrom()) || start.isAfter(p.getAvailableTo())) {
            throw new BusinessException("This tour runs between " + p.getAvailableFrom() + " and " + p.getAvailableTo() + " - choose a date in that range");
        }
    }

    private void requireWindow(Booking b) {
        if (!b.withinChangeWindow()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Bookings can only be changed or cancelled up to "
                    + Booking.CHANGE_DEADLINE_DAYS + " days before travel. Please contact our support team.");
        }
    }

    private Booking owned(Long id, User customer) {
        Booking b = find(id);
        if (!b.getCustomer().getId().equals(customer.getId())) {
            throw new NotFoundException("Booking", id);   // do not reveal other customers' bookings
        }
        return b;
    }

    public Booking find(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new NotFoundException("Booking", id));
    }

    private String newReference() {
        String ref;
        do {
            ref = "BK" + (LocalDate.now().getYear() % 100) + String.format("%05d", random.nextInt(100000));
        } while (bookingRepository.existsByReference(ref));
        return ref;
    }

    private static int suggestedRooms(int travellers) {
        return (travellers + 1) / 2;
    }

    private static int suggestedMinRooms(int travellers) {
        return (travellers + MAX_GUESTS_PER_ROOM - 1) / MAX_GUESTS_PER_ROOM;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
