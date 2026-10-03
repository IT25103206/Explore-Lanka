package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto;

import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.CODE;
import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.CODE_MSG;

public final class TourPackageDtos {

    private TourPackageDtos() {
    }

    public record ItineraryDayDto(
            @Min(value = 1, message = "Day number starts at 1") int dayNumber,
            @NotBlank(message = "Day title is required") @Size(max = 120) String title,
            @Size(max = 1000) String description,
            @Size(max = 80) String location,
            @Size(max = 300) String route) {

        public static ItineraryDayDto from(PackageItineraryDay d) {
            return new ItineraryDayDto(d.getDayNumber(), d.getTitle(), d.getDescription(), d.getLocation(), d.getRoute());
        }
    }

    public record TourPackageRequest(
            @NotNull(message = "Choose a package type") PackageType type,
            @NotBlank(message = "Package code is required") @Pattern(regexp = CODE, message = CODE_MSG) String code,
            @NotBlank(message = "Package name is required") @Size(min = 3, max = 120) String name,
            @NotNull(message = "Choose a category") TourPackage.Category category,
            @NotBlank(message = "Region is required") @Size(max = 40) String region,
            @NotBlank(message = "List at least one destination") @Size(max = 255) String destinations,
            @Min(value = 1, message = "A tour lasts at least 1 day") @Max(value = 30, message = "Tours are limited to 30 days") int durationDays,
            @NotNull(message = "Price is required") @DecimalMin(value = "1000.00", message = "Price must be at least LKR 1,000")
            @DecimalMax(value = "5000000.00", message = "Price looks too high") BigDecimal basePrice,
            @Min(value = 1, message = "Group size must be at least 1") @Max(value = 60, message = "Maximum group size is 60") int maxGroupSize,
            boolean guideRecommended,
            @Size(max = 2000) String description,
            @Size(max = 1000) String highlights,
            @Size(max = 1000) String inclusions,
            @Size(max = 1000) String exclusions,
            @Size(max = 255) String imageUrl,
            @NotNull(message = "Start of the schedule window is required") LocalDate availableFrom,
            @NotNull(message = "End of the schedule window is required") LocalDate availableTo,
            TourPackage.Status status,
            // seasonal packages
            @Size(max = 60) String seasonName,
            LocalDate seasonStart,
            LocalDate seasonEnd,
            BigDecimal seasonalAdjustmentPercent,
            // custom packages
            BigDecimal extraDayPrice,
            Integer maxExtraDays,
            @Valid List<ItineraryDayDto> itinerary) {
    }

    public record StatusRequest(@NotNull(message = "Status is required") TourPackage.Status status) {
    }

    public record TourPackageResponse(
            Long id, String code, String name, PackageType type, TourPackage.Category category, String region,
            List<String> destinations, int durationDays, int nights, BigDecimal basePrice, BigDecimal currentPrice,
            int maxGroupSize, boolean guideRecommended, String description, String highlights, String inclusions,
            String exclusions, String imageUrl, LocalDate availableFrom, LocalDate availableTo, TourPackage.Status status,
            boolean bookable, String seasonName, LocalDate seasonStart, LocalDate seasonEnd,
            BigDecimal seasonalAdjustmentPercent, boolean inSeasonNow, BigDecimal extraDayPrice, int maxExtraDays,
            List<ItineraryDayDto> itinerary, double averageRating, long reviewCount, long bookingCount, boolean trending) {

        public static TourPackageResponse from(TourPackage p, double avgRating, long reviews, long bookings, boolean trending) {
            String seasonName = null;
            LocalDate seasonStart = null;
            LocalDate seasonEnd = null;
            BigDecimal adjustment = null;
            boolean inSeason = false;
            BigDecimal extraDayPrice = null;
            if (p instanceof SeasonalPackage s) {
                seasonName = s.getSeasonName();
                seasonStart = s.getSeasonStart();
                seasonEnd = s.getSeasonEnd();
                adjustment = s.getSeasonalAdjustmentPercent();
                inSeason = s.inSeason(LocalDate.now());
            }
            if (p instanceof CustomPackage c) {
                extraDayPrice = c.getExtraDayPrice();
            }
            return new TourPackageResponse(p.getId(), p.getCode(), p.getName(), p.getPackageType(), p.getCategory(),
                    p.getRegion(), p.destinationList(), p.getDurationDays(), p.getDurationDays() - 1, p.getBasePrice(),
                    p.pricePerAdult(LocalDate.now()), p.getMaxGroupSize(), p.isGuideRecommended(), p.getDescription(),
                    p.getHighlights(), p.getInclusions(), p.getExclusions(), p.getImageUrl(), p.getAvailableFrom(),
                    p.getAvailableTo(), p.getStatus(), p.isBookable(), seasonName, seasonStart, seasonEnd, adjustment,
                    inSeason, extraDayPrice, p.maxExtraDays(),
                    p.getItineraryDays().stream().map(ItineraryDayDto::from).toList(),
                    avgRating, reviews, bookings, trending);
        }
    }

    /** Lightweight item for dropdowns (linking promotions and events to packages). */
    public record PackageOption(Long id, String code, String name, String region, TourPackage.Status status) {
        public static PackageOption from(TourPackage p) {
            return new PackageOption(p.getId(), p.getCode(), p.getName(), p.getRegion(), p.getStatus());
        }
    }
}
