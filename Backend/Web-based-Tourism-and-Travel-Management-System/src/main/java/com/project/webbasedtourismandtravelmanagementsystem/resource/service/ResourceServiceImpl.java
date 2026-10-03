package com.project.webbasedtourismandtravelmanagementsystem.resource.service;


import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Resource;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.ResourceRepository;
import com.project.webbasedtourismandtravelmanagementsystem.Partner.Model.Partner;
import com.project.webbasedtourismandtravelmanagementsystem.Partner.Repository.Partner_Repository;
import com.project.webbasedtourismandtravelmanagementsystem.Event.Model.Event;
import com.project.webbasedtourismandtravelmanagementsystem.Event.Repository.EventRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;


import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Set;



@Service
public class ResourceServiceImpl
        implements ResourceService {

    private static final Set<String> TYPES = Set.of("VEHICLE", "ROOM", "GUIDE", "EQUIPMENT", "VENUE", "OTHER");
    private static final Set<String> STATUSES = Set.of("AVAILABLE", "BOOKED", "MAINTENANCE", "UNAVAILABLE");


    private final ResourceRepository resourceRepository;
    private final Partner_Repository partnerRepository;
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;



    public ResourceServiceImpl(
            ResourceRepository resourceRepository,
            Partner_Repository partnerRepository,
            BookingRepository bookingRepository,
            EventRepository eventRepository) {

        this.resourceRepository = resourceRepository;
        this.partnerRepository = partnerRepository;
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
    }



    @Override
    public Resource createResource(Resource resource) {

        validateAndResolve(resource, null);
        return resourceRepository.save(resource);
    }



    @Override
    public List<Resource> getAllResources() {

        return resourceRepository.findAll();
    }



    @Override
    public Resource getResourceById(Long id) {

        return resourceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Resource not found"));
    }



    @Override
    public Resource updateResource(
            Long id,
            Resource resource) {


        Resource existing =
                getResourceById(id);

        validateAndResolve(resource, id);


        existing.setResourceName(
                resource.getResourceName());


        existing.setResourceType(
                resource.getResourceType());


        existing.setAvailabilityStatus(
                resource.getAvailabilityStatus());


        existing.setCost(
                resource.getCost());

        existing.setPartner(resource.getPartner());
        existing.setRegistrationNumber(resource.getRegistrationNumber());
        existing.setLocation(resource.getLocation());
        existing.setCapacity(resource.getCapacity());
        existing.setDescription(resource.getDescription());
        existing.setAvailableFrom(resource.getAvailableFrom());
        existing.setAvailableUntil(resource.getAvailableUntil());
        existing.setAssignedBooking(resource.getAssignedBooking());
        existing.setAssignedEvent(resource.getAssignedEvent());
        existing.setAllocationStartDate(resource.getAllocationStartDate());
        existing.setAllocationEndDate(resource.getAllocationEndDate());
        existing.setAllocationNotes(resource.getAllocationNotes());


        return resourceRepository.save(existing);
    }



    @Override
    public void deleteResource(Long id) {

        Resource resource = getResourceById(id);
        if (resource.getAssignedBooking() != null || resource.getAssignedEvent() != null) {
            throw new IllegalStateException("This resource is currently allocated. Clear its booking or event assignment before deleting it.");
        }
        resourceRepository.deleteById(id);

    }

    private void validateAndResolve(Resource resource, Long currentId) {
        if (resource == null) throw new IllegalArgumentException("Resource details are required.");

        resource.setResourceName(required(resource.getResourceName(), "Resource name"));
        String type = required(resource.getResourceType(), "Resource type").toUpperCase();
        if (!TYPES.contains(type)) throw new IllegalArgumentException("Invalid resource type.");
        resource.setResourceType(type.substring(0, 1) + type.substring(1).toLowerCase());

        String status = required(resource.getAvailabilityStatus(), "Availability status").toUpperCase();
        if (!STATUSES.contains(status)) throw new IllegalArgumentException("Invalid availability status.");
        resource.setAvailabilityStatus(status);

        if (resource.getCost() == null || resource.getCost() < 0) {
            throw new IllegalArgumentException("Cost is required and cannot be negative.");
        }
        if (resource.getCapacity() != null && resource.getCapacity() < 1) {
            throw new IllegalArgumentException("Capacity must be at least 1.");
        }

        String registration = optional(resource.getRegistrationNumber());
        resource.setRegistrationNumber(registration);
        if (registration != null) {
            resourceRepository.findByRegistrationNumberIgnoreCase(registration).ifPresent(found -> {
                if (currentId == null || !found.getResourceId().equals(currentId)) {
                    throw new IllegalArgumentException("Registration/reference number already belongs to another resource.");
                }
            });
        }

        resource.setLocation(optional(resource.getLocation()));
        resource.setDescription(optional(resource.getDescription()));
        resource.setAllocationNotes(optional(resource.getAllocationNotes()));

        if (resource.getAvailableFrom() != null && resource.getAvailableUntil() != null
                && resource.getAvailableUntil().isBefore(resource.getAvailableFrom())) {
            throw new IllegalArgumentException("Available-until date must be on or after the available-from date.");
        }

        if (resource.getPartner() == null || resource.getPartner().getPartnerId() == null) {
            throw new IllegalArgumentException("An active partner is required.");
        }
        Partner partner = partnerRepository.findById(resource.getPartner().getPartnerId())
                .orElseThrow(() -> new IllegalArgumentException("Selected partner was not found."));
        if (!"ACTIVE".equalsIgnoreCase(partner.getStatus())) {
            throw new IllegalArgumentException("Only active partners can provide resources.");
        }
        resource.setPartner(partner);

        Booking booking = null;
        if (resource.getAssignedBooking() != null && resource.getAssignedBooking().getBookingId() != null) {
            booking = bookingRepository.findById(resource.getAssignedBooking().getBookingId())
                    .orElseThrow(() -> new IllegalArgumentException("Selected booking was not found."));
            if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("A resource cannot be assigned to a cancelled booking.");
            }
        }
        Event event = null;
        if (resource.getAssignedEvent() != null && resource.getAssignedEvent().getEventId() != null) {
            event = eventRepository.findById(resource.getAssignedEvent().getEventId())
                    .orElseThrow(() -> new IllegalArgumentException("Selected event was not found."));
            if ("CANCELLED".equalsIgnoreCase(event.getStatus())) {
                throw new IllegalArgumentException("A resource cannot be assigned to a cancelled event.");
            }
        }
        if (booking != null && event != null) {
            throw new IllegalArgumentException("Assign a resource to either a booking or an event, not both.");
        }
        resource.setAssignedBooking(booking);
        resource.setAssignedEvent(event);

        boolean allocated = booking != null || event != null;
        if (allocated) {
            if (resource.getAllocationStartDate() == null || resource.getAllocationEndDate() == null) {
                throw new IllegalArgumentException("Allocation start and end dates are required.");
            }
            if (resource.getAllocationEndDate().isBefore(resource.getAllocationStartDate())) {
                throw new IllegalArgumentException("Allocation end date must be on or after its start date.");
            }
            if (resource.getAvailableFrom() != null && resource.getAllocationStartDate().isBefore(resource.getAvailableFrom())) {
                throw new IllegalArgumentException("Allocation starts before the resource becomes available.");
            }
            if (resource.getAvailableUntil() != null && resource.getAllocationEndDate().isAfter(resource.getAvailableUntil())) {
                throw new IllegalArgumentException("Allocation ends after the resource availability period.");
            }
            resource.setAvailabilityStatus("BOOKED");
        } else {
            resource.setAllocationStartDate(null);
            resource.setAllocationEndDate(null);
            if ("BOOKED".equals(status)) {
                throw new IllegalArgumentException("Choose a booking or event before marking a resource as BOOKED.");
            }
        }
    }

    private String required(String value, String label) {
        String result = optional(value);
        if (result == null) throw new IllegalArgumentException(label + " is required.");
        return result;
    }

    private String optional(String value) {
        if (value == null) return null;
        String result = value.trim();
        return result.isEmpty() ? null : result;
    }

}
