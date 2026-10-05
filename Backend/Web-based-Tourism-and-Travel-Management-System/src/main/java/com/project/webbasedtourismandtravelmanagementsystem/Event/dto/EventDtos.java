package com.project.webbasedtourismandtravelmanagementsystem.event.dto;

import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventRegistration;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

public final class EventDtos {

    private EventDtos() {
    }

    /** UC-04 event creation form: name, category, date, time, location, dress code, description, max participants. */
    public record EventRequest(
            @NotBlank(message = "Event name is required") @Size(min = 3, max = 120) String name,
            @NotNull(message = "Choose a category") EventFestival.Category category,
            @Size(max = 2000) String description,
            @NotBlank(message = "Region is required") @Size(max = 40) String region,
            @NotBlank(message = "Location is required") @Size(max = 150) String location,
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @NotNull(message = "Start time is required") LocalTime startTime,
            @NotNull(message = "End time is required") LocalTime endTime,
            @Size(max = 150) String dressCode,
            @Min(value = 1, message = "Allow at least 1 participant") @Max(value = 100000, message = "At most 100,000 participants") int maxParticipants,
            @NotNull(message = "Ticket price is required (0 for free events)") @DecimalMin(value = "0.00", message = "Ticket price cannot be negative") BigDecimal ticketPrice,
            @Size(max = 255) String imageUrl,
            Set<Long> packageIds,
            /* true = Submit and publish, false = Save as Draft (7a) */
            boolean publish) {
    }

    public record LinkedPackage(Long id, String name) {
    }

    public record EventResponse(Long id, String name, EventFestival.Category category, String description, String region,
                                String location, LocalDate startDate, LocalDate endDate, LocalTime startTime,
                                LocalTime endTime, String duration, String dressCode, int maxParticipants, long registered,
                                long spotsLeft, BigDecimal ticketPrice, String imageUrl, EventFestival.Status status,
                                List<LinkedPackage> linkedPackages, String createdBy) {
        public static EventResponse from(EventFestival e, long registered) {
            return new EventResponse(e.getId(), e.getName(), e.getCategory(), e.getDescription(), e.getRegion(),
                    e.getLocation(), e.getStartDate(), e.getEndDate(), e.getStartTime(), e.getEndTime(), duration(e),
                    e.getDressCode(), e.getMaxParticipants(), registered, Math.max(0, e.getMaxParticipants() - registered),
                    e.getTicketPrice(), e.getImageUrl(), e.getStatus(),
                    e.getLinkedPackages().stream().map(p -> new LinkedPackage(p.getId(), p.getName())).toList(),
                    e.getCreatedBy());
        }

        private static String duration(EventFestival e) {
            long days = ChronoUnit.DAYS.between(e.getStartDate(), e.getEndDate()) + 1;
            Duration perDay = Duration.between(e.getStartTime(), e.getEndTime());
            String hours = perDay.toMinutes() % 60 == 0 ? perDay.toHours() + " h" : perDay.toHours() + " h " + perDay.toMinutes() % 60 + " min";
            return days == 1 ? hours : days + " days, " + hours + " per day";
        }
    }

    public record RegistrationRequest(
            @Min(value = 1, message = "At least 1 participant") @Max(value = 20, message = "At most 20 participants per registration") int participants) {
    }

    public record RegistrationResponse(Long id, Long eventId, String eventName, LocalDate eventDate, String location,
                                       String customerName, String customerEmail, int participants,
                                       EventRegistration.Status status, LocalDateTime createdAt) {
        public static RegistrationResponse from(EventRegistration r) {
            return new RegistrationResponse(r.getId(), r.getEvent().getId(), r.getEvent().getName(),
                    r.getEvent().getStartDate(), r.getEvent().getLocation(), r.getCustomer().getFullName(),
                    r.getCustomer().getEmail(), r.getParticipants(), r.getStatus(), r.getCreatedAt());
        }
    }
}
