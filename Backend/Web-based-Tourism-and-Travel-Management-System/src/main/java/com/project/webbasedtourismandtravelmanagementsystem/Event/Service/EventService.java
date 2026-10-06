package com.project.webbasedtourismandtravelmanagementsystem.event.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.event.dto.EventDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventRegistration;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventFestivalRepository;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventRegistrationRepository;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Event & Festival Information Management (IT25100579 Jayasena J.A.D.K) - UC-04 Create Event. */
@Service
@Transactional
public class EventService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final EventFestivalRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final TourPackageRepository packageRepository;
    private final NotificationService notificationService;

    public EventService(EventFestivalRepository eventRepository, EventRegistrationRepository registrationRepository,
                        TourPackageRepository packageRepository, NotificationService notificationService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.packageRepository = packageRepository;
        this.notificationService = notificationService;
    }

    // ------------------------------------------------------------------ tourists (view / filter events, PBI-07)

    @Transactional(readOnly = true)
    public List<EventResponse> upcoming(String region, EventFestival.Category category, LocalDate from, LocalDate to, String q) {
        String term = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return eventRepository.findByStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(EventFestival.Status.PUBLISHED, LocalDate.now()).stream()
                .filter(e -> region == null || region.isBlank() || e.getRegion().equalsIgnoreCase(region))
                .filter(e -> category == null || e.getCategory() == category)
                .filter(e -> from == null || !e.getEndDate().isBefore(from))
                .filter(e -> to == null || !e.getStartDate().isAfter(to))
                .filter(e -> term.isEmpty() || (e.getName() + " " + e.getLocation() + " " + Objects.toString(e.getDescription(), ""))
                        .toLowerCase(Locale.ROOT).contains(term))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse publicDetails(Long id) {
        EventFestival e = find(id);
        if (e.getStatus() != EventFestival.Status.PUBLISHED) {
            throw new NotFoundException("Event", id);
        }
        return toResponse(e);
    }

    /** Festivals near a tour: linked to the package or in its region, around the travel date if given. */
    @Transactional(readOnly = true)
    public List<EventResponse> forPackage(Long packageId, LocalDate travelDate) {
        TourPackage p = packageRepository.findById(packageId).orElseThrow(() -> new NotFoundException("Tour package", packageId));
        LocalDate from = travelDate == null ? LocalDate.now() : travelDate.minusDays(3);
        LocalDate to = travelDate == null ? LocalDate.now().plusMonths(6) : travelDate.plusDays(p.getDurationDays() + 3L);
        return eventRepository.findByStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(EventFestival.Status.PUBLISHED, LocalDate.now()).stream()
                .filter(e -> e.getLinkedPackages().stream().anyMatch(x -> x.getId().equals(packageId))
                        || e.getRegion().equalsIgnoreCase(p.getRegion()))
                .filter(e -> !e.getEndDate().isBefore(from) && !e.getStartDate().isAfter(to))
                .map(this::toResponse)
                .toList();
    }

    // ------------------------------------------------------------------ registrations (PBI-20)

    public RegistrationResponse register(Long eventId, int participants, User customer) {
        EventFestival e = find(eventId);
        if (e.getStatus() != EventFestival.Status.PUBLISHED || e.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Registrations are closed for this event");
        }
        Optional<EventRegistration> existing = registrationRepository.findByEventIdAndCustomerId(eventId, customer.getId());
        if (existing.isPresent() && existing.get().getStatus() == EventRegistration.Status.REGISTERED) {
            throw BusinessException.conflict("You are already registered for this event");
        }
        long taken = registrationRepository.registeredParticipants(eventId);
        long left = e.getMaxParticipants() - taken;
        if (participants > left) {
            throw BusinessException.conflict(left <= 0 ? "This event is fully booked" : "Only " + left + " spot(s) left for this event");
        }
        EventRegistration r = existing.orElseGet(EventRegistration::new);
        r.setEvent(e);
        r.setCustomer(customer);
        r.setParticipants(participants);
        r.setStatus(EventRegistration.Status.REGISTERED);
        registrationRepository.save(r);
        notificationService.notify(customer, Notification.Type.EVENT, "Registered: " + e.getName(),
                participants + " place(s) reserved for " + DAY.format(e.getStartDate()) + " at " + e.getLocation()
                        + (e.getDressCode() == null ? "" : ". Dress code: " + e.getDressCode()), "/customer/events.html");
        return RegistrationResponse.from(r);
    }

    public void cancelRegistration(Long eventId, User customer) {
        EventRegistration r = registrationRepository.findByEventIdAndCustomerId(eventId, customer.getId())
                .filter(x -> x.getStatus() == EventRegistration.Status.REGISTERED)
                .orElseThrow(() -> new NotFoundException("You are not registered for this event"));
        r.setStatus(EventRegistration.Status.CANCELLED);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> myRegistrations(User customer) {
        return registrationRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(customer.getId(), EventRegistration.Status.REGISTERED)
                .stream().map(RegistrationResponse::from).toList();
    }

    // ------------------------------------------------------------------ management (UC-04)

    @Transactional(readOnly = true)
    public List<EventResponse> listAll() {
        return eventRepository.findAllByOrderByStartDateAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EventResponse get(Long id) {
        return toResponse(find(id));
    }

    public EventResponse create(EventRequest r, String actor) {
        validate(r, null);                                        // step 4 / 4a
        if (r.startDate().isBefore(LocalDate.now())) {
            throw new BusinessException("The event date cannot be in the past");
        }
        checkClash(r, null);                                      // step 6 / 6a
        EventFestival e = new EventFestival();
        apply(e, r);
        e.setCreatedBy(actor);
        e.setStatus(r.publish() ? EventFestival.Status.PUBLISHED : EventFestival.Status.DRAFT);   // 7 / 7a
        return toResponse(eventRepository.save(e));
    }

    public EventResponse update(Long id, EventRequest r) {
        EventFestival e = find(id);
        validate(r, e);
        checkClash(r, id);
        long registered = registrationRepository.registeredParticipants(id);
        if (r.maxParticipants() < registered) {
            throw BusinessException.conflict(registered + " people are already registered - the limit cannot be lower than that");
        }
        boolean scheduleChanged = !e.getStartDate().equals(r.startDate()) || !e.getEndDate().equals(r.endDate())
                || !e.getStartTime().equals(r.startTime()) || !e.getLocation().equalsIgnoreCase(r.location().trim());
        apply(e, r);
        if (e.getStatus() == EventFestival.Status.EXPIRED && !r.endDate().isBefore(LocalDate.now())) {
            e.setStatus(EventFestival.Status.DRAFT);
        }
        if (r.publish() && e.getStatus() != EventFestival.Status.PUBLISHED) {
            e.setStatus(EventFestival.Status.PUBLISHED);
        }
        if (scheduleChanged) {   // use-case extension: notify registered tourists when date/location changes
            notifyRegistrants(e, "Schedule change: " + e.getName(),
                    "Now on " + DAY.format(e.getStartDate()) + " at " + e.getStartTime() + ", " + e.getLocation() + ".");
        }
        return toResponse(e);
    }

    public EventResponse publish(Long id) {
        EventFestival e = find(id);
        if (e.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessException("This event has already ended and cannot be published");
        }
        e.setStatus(EventFestival.Status.PUBLISHED);
        return toResponse(e);
    }

    public EventResponse deactivate(Long id) {
        EventFestival e = find(id);
        e.setStatus(EventFestival.Status.DEACTIVATED);
        notifyRegistrants(e, "Event cancelled: " + e.getName(), "Unfortunately this event will not take place as planned.");
        return toResponse(e);
    }

    public void delete(Long id) {
        EventFestival e = find(id);
        notifyRegistrants(e, "Event cancelled: " + e.getName(), "This event has been removed from the calendar.");
        registrationRepository.deleteByEventId(id);
        eventRepository.delete(e);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> registrations(Long eventId) {
        find(eventId);
        return registrationRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream().map(RegistrationResponse::from).toList();
    }

    /** Nightly: past events are expired automatically. */
    public int expirePast() {
        List<EventFestival> past = eventRepository.findByStatusInAndEndDateBefore(
                List.of(EventFestival.Status.PUBLISHED, EventFestival.Status.DRAFT), LocalDate.now());
        past.forEach(e -> e.setStatus(EventFestival.Status.EXPIRED));
        return past.size();
    }

    // ------------------------------------------------------------------ helpers

    private void validate(EventRequest r, EventFestival existing) {
        if (r.endDate().isBefore(r.startDate())) {
            throw new BusinessException("The end date must be on or after the start date");
        }
        if (!r.endTime().isAfter(r.startTime())) {
            throw new BusinessException("The end time must be after the start time");
        }
        if (r.startDate().plusDays(31).isBefore(r.endDate())) {
            throw new BusinessException("An event can last at most 31 days");
        }
    }

    /** 6a: another active event at the same location whose dates and times overlap. */
    private void checkClash(EventRequest r, Long selfId) {
        List<String> clashes = eventRepository
                .findByLocationIgnoreCaseAndStartDateLessThanEqualAndEndDateGreaterThanEqual(r.location().trim(), r.endDate(), r.startDate())
                .stream()
                .filter(e -> selfId == null || !e.getId().equals(selfId))
                .filter(e -> e.getStatus() == EventFestival.Status.PUBLISHED || e.getStatus() == EventFestival.Status.DRAFT)
                .filter(e -> r.startTime().isBefore(e.getEndTime()) && e.getStartTime().isBefore(r.endTime()))
                .map(e -> e.getName() + " (" + DAY.format(e.getStartDate()) + ", " + e.getStartTime() + "-" + e.getEndTime() + ")")
                .toList();
        if (!clashes.isEmpty()) {
            throw BusinessException.conflict("Scheduling clash at " + r.location().trim() + ". Choose a different date, time or location.", clashes);
        }
    }

    private void apply(EventFestival e, EventRequest r) {
        e.setName(r.name().trim());
        e.setCategory(r.category());
        e.setDescription(r.description());
        e.setRegion(r.region().trim());
        e.setLocation(r.location().trim());
        e.setStartDate(r.startDate());
        e.setEndDate(r.endDate());
        e.setStartTime(r.startTime());
        e.setEndTime(r.endTime());
        e.setDressCode(r.dressCode() == null || r.dressCode().isBlank() ? null : r.dressCode().trim());
        e.setMaxParticipants(r.maxParticipants());
        e.setTicketPrice(r.ticketPrice());
        e.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? "/images/destinations/kandy.png" : r.imageUrl().trim());
        Set<TourPackage> packages = new HashSet<>();
        if (r.packageIds() != null) {
            for (Long pid : r.packageIds()) {
                packages.add(packageRepository.findById(pid).orElseThrow(() -> new NotFoundException("Tour package", pid)));
            }
        }
        e.getLinkedPackages().clear();
        e.getLinkedPackages().addAll(packages);
    }

    private void notifyRegistrants(EventFestival e, String title, String message) {
        registrationRepository.findByEventIdAndStatus(e.getId(), EventRegistration.Status.REGISTERED)
                .forEach(r -> notificationService.notify(r.getCustomer(), Notification.Type.EVENT, title, message, "/events.html"));
    }

    private EventResponse toResponse(EventFestival e) {
        return EventResponse.from(e, registrationRepository.registeredParticipants(e.getId()));
    }

    private EventFestival find(Long id) {
        return eventRepository.findById(id).orElseThrow(() -> new NotFoundException("Event", id));
    }
}
