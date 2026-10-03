package com.project.webbasedtourismandtravelmanagementsystem.booking.dto;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.ItineraryItem;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.TravelerDetail;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.AllocationResponse;
import com.project.webbasedtourismandtravelmanagementsystem.resource.dto.ResourceDtos.ResourceOption;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.PackageType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.NAME;
import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.NAME_MSG;

public final class BookingDtos {

    private BookingDtos() {
    }

    public record TravelerDto(
            @NotBlank(message = "Traveller name is required") @Pattern(regexp = NAME, message = NAME_MSG) String fullName,
            @NotNull(message = "Choose adult or child") TravelerDetail.Type type,
            @Min(value = 0, message = "Age cannot be negative") @Max(value = 120, message = "Enter a valid age") int age,
            @Size(max = 60) String nationality,
            @Pattern(regexp = "^([A-Za-z0-9]{5,20})?$", message = "Passport / NIC: 5-20 letters and digits") String passportOrNic) {

        public static TravelerDto from(TravelerDetail t) {
            return new TravelerDto(t.getFullName(), t.getType(), t.getAge(), t.getNationality(), t.getPassportOrNic());
        }

        public static TravelerDto masked(TravelerDetail t) {
            String id = t.getPassportOrNic();
            String masked = id == null || id.length() < 4 ? id : "*".repeat(id.length() - 3) + id.substring(id.length() - 3);
            return new TravelerDto(t.getFullName(), t.getType(), t.getAge(), t.getNationality(), masked);
        }
    }

    /** Booking form (UC-06 steps 2-3): destination/package, dates, accommodation, transport, extras. */
    public record BookingRequest(
            @NotNull(message = "Choose a tour package") Long packageId,
            @NotNull(message = "Choose a travel date") LocalDate startDate,
            @Min(value = 1, message = "At least one adult must travel") @Max(value = 60) int adults,
            @Min(value = 0, message = "Children cannot be negative") @Max(value = 40) int children,
            @Min(value = 0, message = "Extra days cannot be negative") @Max(value = 14) int extraDays,
            @Min(value = 0, message = "Rooms cannot be negative") @Max(value = 30, message = "At most 30 rooms") int rooms,
            Long hotelId,
            Long vehicleId,
            boolean guideRequired,
            @Size(max = 40) String guideLanguage,
            @Size(max = 30) String promoCode,
            @Size(max = 1000, message = "Keep special requests under 1000 characters") String specialRequests,
            @Valid List<TravelerDto> travelers) {
    }

    /** UC-06 modify: confirmed bookings may only change travellers and special requests. */
    public record TravellerUpdateRequest(
            @Size(max = 1000, message = "Keep special requests under 1000 characters") String specialRequests,
            @NotEmpty(message = "Traveller details are required") @Valid List<TravelerDto> travelers) {
    }

    public record CancelRequest(@NotBlank(message = "Please tell us why you are cancelling") @Size(max = 500) String reason) {
    }

    /** Options shown in the booking form for the chosen package and date. */
    public record BookingOptions(Long packageId, String packageName, PackageType packageType, LocalDate startDate,
                                 LocalDate endDate, int nights, int days, int maxGroupSize, int maxExtraDays,
                                 int suggestedRooms, List<ResourceOption> hotels, List<ResourceOption> vehicles,
                                 boolean guideAvailable, BigDecimal guideDailyRate, List<String> warnings) {
    }

    /** Booking summary with total cost (UC-06 steps 4-6). */
    public record QuoteResponse(Long packageId, String packageName, LocalDate startDate, LocalDate endDate, int nights,
                                int days, int adults, int children, int extraDays, int rooms,
                                Long hotelId, String hotelName, BigDecimal hotelRate,
                                Long vehicleId, String vehicleName, BigDecimal vehicleRate,
                                boolean guideRequired, BigDecimal guideRate,
                                BigDecimal adultPrice, BigDecimal packageCost, BigDecimal accommodationCost,
                                BigDecimal transportCost, BigDecimal guideCost, BigDecimal subtotal,
                                BigDecimal discount, BigDecimal total, String promoCode, String promoTitle,
                                boolean promoApplied, String promoMessage, String pricingNote,
                                boolean available, List<String> availabilityIssues) {
    }

    public record BookingResponse(
            Long id, String reference, BookingStatus status, Long packageId, String packageName, String packageImage,
            PackageType packageType, String region, LocalDate startDate, LocalDate endDate, int nights,
            int adults, int children, int extraDays, int rooms, Long hotelId, String hotelName, Long vehicleId,
            String vehicleName, boolean guideRequired, String guideLanguage, String specialRequests,
            BigDecimal packageCost, BigDecimal accommodationCost, BigDecimal transportCost, BigDecimal guideCost,
            BigDecimal subtotal, BigDecimal discountAmount, BigDecimal totalAmount, String promoCode,
            LocalDateTime createdAt, LocalDateTime confirmedAt, LocalDateTime cancelledAt, String cancellationReason,
            Long customerId, String customerName, String customerEmail, String customerPhone,
            List<TravelerDto> travelers, List<AllocationResponse> allocations, List<String> missingResources,
            long daysUntilTravel, boolean canModify, boolean canEditAll, boolean canCancel, boolean canPay,
            boolean canReview, boolean hasFeedback, BigDecimal paidAmount, String refundStatus) {
    }

    public record ItineraryItemDto(int dayNumber, LocalDate date, ItineraryItem.Type type, String title,
                                   String description, String location, String route, String addedBy) {
        public static ItineraryItemDto from(ItineraryItem i) {
            return new ItineraryItemDto(i.getDayNumber(), i.getDate(), i.getType(), i.getTitle(), i.getDescription(),
                    i.getLocation(), i.getRoute(), i.getAddedBy());
        }
    }

    public record ItineraryResponse(Long bookingId, String reference, String packageName, LocalDate startDate,
                                    LocalDate endDate, List<String> resources, List<ItineraryItemDto> items) {
    }
}
