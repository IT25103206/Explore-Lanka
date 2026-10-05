package com.project.webbasedtourismandtravelmanagementsystem.resource.dto;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.*;

public final class ResourceDtos {

    private ResourceDtos() {
    }

    // ------------------------------------------------------------------ requests

    public record HotelRequest(
            Long supplierId,
            @NotBlank(message = "Hotel name is required") @Size(max = 120) String name,
            @NotBlank(message = "City is required") @Size(max = 60) String city,
            @Size(max = 255) String address,
            @Min(value = 1, message = "Star rating is 1-5") @Max(value = 5, message = "Star rating is 1-5") int starRating,
            @Min(value = 1, message = "At least 1 room") @Max(value = 500, message = "At most 500 rooms") int totalRooms,
            @NotNull(message = "Price per night is required") @DecimalMin(value = "500.00", message = "Price per night must be at least LKR 500") BigDecimal pricePerNight,
            @Size(max = 500) String amenities,
            @Size(max = 1000) String description,
            @Size(max = 255) String imageUrl,
            boolean active) {
    }

    public record VehicleRequest(
            Long supplierId,
            @NotNull(message = "Vehicle type is required") Vehicle.Type type,
            @NotBlank(message = "Model is required") @Size(max = 80) String model,
            @NotBlank(message = "Registration number is required")
            @Pattern(regexp = "^[A-Z]{2,3}[- ]?[A-Z]{0,3}[- ]?\\d{4}$", message = "Use a Sri Lankan registration such as CAB-1234 or WP KA-4567")
            String registrationNo,
            @Min(value = 1, message = "At least 1 seat") @Max(value = 60, message = "At most 60 seats") int seats,
            @NotNull(message = "Price per day is required") @DecimalMin(value = "1000.00", message = "Price per day must be at least LKR 1,000") BigDecimal pricePerDay,
            @Pattern(regexp = "^([A-Za-z][A-Za-z .'-]{1,99})?$", message = NAME_MSG) String driverName,
            boolean airConditioned,
            boolean active) {
    }

    public record GuideRequest(
            Long supplierId,
            Long userId,
            @NotBlank(message = "Full name is required") @Pattern(regexp = NAME, message = NAME_MSG) String fullName,
            @NotBlank(message = "Licence number is required") @Pattern(regexp = "^[A-Z0-9/-]{4,30}$", message = "Licence number: 4-30 upper-case letters, digits, / or -") String licenseNo,
            @NotBlank(message = "List at least one language") @Size(max = 200) String languages,
            @Size(max = 200) String specialization,
            @Min(value = 0, message = "Experience cannot be negative") @Max(value = 60) int experienceYears,
            @NotNull(message = "Price per day is required") @DecimalMin(value = "1000.00", message = "Price per day must be at least LKR 1,000") BigDecimal pricePerDay,
            @Pattern(regexp = PHONE, message = PHONE_MSG) String phone,
            @Email(message = "Enter a valid email") String email,
            boolean active) {
    }

    public record BlockDatesRequest(
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @Size(max = 200) String reason) {
    }

    /** UC-03: the hotel partner enters the available rooms for a date range. */
    public record ScheduleUpdateRequest(
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @NotNull(message = "Enter the number of available rooms")
            @Min(value = 0, message = "Available rooms cannot be negative")
            @Max(value = 500, message = "At most 500 rooms") Integer availableRooms) {
    }

    /** UC-01: the Tour Operations Manager's selection. Null = keep the current allocation. */
    public record AllocateRequest(Long hotelId, Long vehicleId, Long guideId) {
    }

    public record WaypointRequest(
            @Min(value = 1, message = "Day number starts at 1") int dayNumber,
            @NotBlank(message = "Title is required") @Size(max = 150) String title,
            @Size(max = 80) String location,
            @Size(max = 300) String route,
            @Size(max = 1000) String description) {
    }

    // ------------------------------------------------------------------ responses

    public record HotelResponse(Long id, Long supplierId, String supplierName, String name, String city, String address,
                                int starRating, int totalRooms, BigDecimal pricePerNight, String amenities,
                                String description, String imageUrl, boolean active) {
        public static HotelResponse from(Hotel h) {
            return new HotelResponse(h.getId(), h.getSupplier() == null ? null : h.getSupplier().getId(),
                    h.getSupplier() == null ? null : h.getSupplier().getName(), h.getName(), h.getCity(), h.getAddress(),
                    h.getStarRating(), h.getTotalRooms(), h.getPricePerNight(), h.getAmenities(), h.getDescription(),
                    h.getImageUrl(), h.isActive());
        }
    }

    public record VehicleResponse(Long id, Long supplierId, String supplierName, Vehicle.Type type, String model,
                                  String registrationNo, int seats, BigDecimal pricePerDay, String driverName,
                                  boolean airConditioned, boolean active, String label) {
        public static VehicleResponse from(Vehicle v) {
            return new VehicleResponse(v.getId(), v.getSupplier() == null ? null : v.getSupplier().getId(),
                    v.getSupplier() == null ? null : v.getSupplier().getName(), v.getType(), v.getModel(),
                    v.getRegistrationNo(), v.getSeats(), v.getPricePerDay(), v.getDriverName(), v.isAirConditioned(),
                    v.isActive(), v.label());
        }
    }

    public record GuideResponse(Long id, Long supplierId, Long userId, String userEmail, String fullName, String licenseNo,
                                String languages, String specialization, int experienceYears, BigDecimal pricePerDay,
                                String phone, String email, boolean active) {
        public static GuideResponse from(TourGuide g) {
            return new GuideResponse(g.getId(), g.getSupplier() == null ? null : g.getSupplier().getId(),
                    g.getUser() == null ? null : g.getUser().getId(), g.getUser() == null ? null : g.getUser().getEmail(),
                    g.getFullName(), g.getLicenseNo(), g.getLanguages(), g.getSpecialization(), g.getExperienceYears(),
                    g.getPricePerDay(), g.getPhone(), g.getEmail(), g.isActive());
        }
    }

    /** A resource offered as a choice, with its availability for the requested dates. */
    public record ResourceOption(Long id, ResourceType type, String name, String detail, BigDecimal price,
                                 int capacity, boolean available, boolean alternative, String unavailableReason,
                                 String imageUrl, String city, int starRating) {
    }

    public record AllocationResponse(Long id, ResourceType resourceType, Long resourceId, String resourceName,
                                     LocalDate startDate, LocalDate endDate, int quantity,
                                     ResourceAllocation.Status status, String allocatedBy) {
        public static AllocationResponse from(ResourceAllocation a) {
            return new AllocationResponse(a.getId(), a.getResourceType(), a.getResourceId(), a.getResourceName(),
                    a.getStartDate(), a.getEndDate(), a.getQuantity(), a.getStatus(), a.getAllocatedBy());
        }
    }

    /** Everything the allocation screen needs for one booking (UC-01 steps 2-4). */
    public record AllocationView(Long bookingId, String reference, String customerName, String packageName,
                                 List<String> destinations, LocalDate startDate, LocalDate endDate, int nights,
                                 int travellers, int rooms, boolean guideRequired, String guideLanguage,
                                 String specialRequests, Long preferredHotelId, Long preferredVehicleId,
                                 List<AllocationResponse> current, List<ResourceOption> hotels,
                                 List<ResourceOption> vehicles, List<ResourceOption> guides, List<String> warnings) {
    }

    /** A booking that still needs resources (shown on the operations dashboard). */
    public record PendingAllocation(Long bookingId, String reference, String customerName, String packageName,
                                    LocalDate startDate, LocalDate endDate, int travellers, List<String> missing) {
    }

    public record CalendarDay(LocalDate date, int capacity, int booked, int free, List<String> bookingRefs) {
    }

    public record BlockedDateResponse(Long id, LocalDate date, String reason) {
        public static BlockedDateResponse from(ResourceBlockedDate b) {
            return new BlockedDateResponse(b.getId(), b.getDate(), b.getReason());
        }
    }

    /** An allocation as seen by a partner or guide (their upcoming work). */
    public record Assignment(Long allocationId, Long bookingId, String reference, String packageName,
                             String resourceName, ResourceType resourceType, LocalDate startDate, LocalDate endDate,
                             int quantity, int travellers, String leadTraveller, String contactPhone,
                             String specialRequests, String guideLanguage) {
    }
}
