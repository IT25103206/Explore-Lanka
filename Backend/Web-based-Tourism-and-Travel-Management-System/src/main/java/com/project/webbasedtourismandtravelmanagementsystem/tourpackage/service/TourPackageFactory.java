package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service;

import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto.TourPackageDtos.ItineraryDayDto;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto.TourPackageDtos.TourPackageRequest;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * FACTORY PATTERN.
 * The controller and service never call "new StandardPackage()" etc. directly - they ask the
 * factory for a package of a {@link PackageType}. Adding a new kind of package (e.g. "Group")
 * only needs a new subclass and one line here.
 */
@Component
public class TourPackageFactory {

    /** Creates an empty package of the requested type. */
    public TourPackage create(PackageType type) {
        return switch (type) {
            case STANDARD -> new StandardPackage();
            case SEASONAL -> new SeasonalPackage();
            case CUSTOM -> new CustomPackage();
        };
    }

    /** Creates a fully populated package from a request. */
    public TourPackage create(TourPackageRequest request) {
        TourPackage p = create(request.type());
        apply(p, request);
        return p;
    }

    /** Copies the request onto a package (used for both create and update) and validates type rules. */
    public void apply(TourPackage p, TourPackageRequest r) {
        if (r.availableTo().isBefore(r.availableFrom())) {
            throw new BusinessException("The schedule end date must be on or after the start date");
        }
        p.setCode(r.code().trim().toUpperCase(Locale.ROOT));
        p.setName(r.name().trim());
        p.setCategory(r.category());
        p.setRegion(r.region().trim());
        p.setDestinations(r.destinations().trim());
        p.setDurationDays(r.durationDays());
        p.setBasePrice(r.basePrice());
        p.setMaxGroupSize(r.maxGroupSize());
        p.setGuideRecommended(r.guideRecommended());
        p.setDescription(r.description());
        p.setHighlights(r.highlights());
        p.setInclusions(r.inclusions());
        p.setExclusions(r.exclusions());
        p.setImageUrl(r.imageUrl() == null || r.imageUrl().isBlank() ? "/images/destinations/sigiriya.png" : r.imageUrl().trim());
        p.setAvailableFrom(r.availableFrom());
        p.setAvailableTo(r.availableTo());
        if (r.status() != null) {
            p.setStatus(r.status());
        }

        if (p instanceof SeasonalPackage s) {
            applySeasonal(s, r);
        } else if (p instanceof CustomPackage c) {
            applyCustom(c, r);
        }
        p.replaceItinerary(itinerary(r.itinerary(), r.durationDays()));
    }

    private void applySeasonal(SeasonalPackage s, TourPackageRequest r) {
        if (r.seasonStart() == null || r.seasonEnd() == null || r.seasonalAdjustmentPercent() == null) {
            throw new BusinessException("Seasonal packages need a season start, season end and price adjustment");
        }
        if (r.seasonEnd().isBefore(r.seasonStart())) {
            throw new BusinessException("The season end date must be on or after the season start date");
        }
        BigDecimal adj = r.seasonalAdjustmentPercent();
        if (adj.compareTo(new BigDecimal("-50")) < 0 || adj.compareTo(new BigDecimal("100")) > 0) {
            throw new BusinessException("Seasonal adjustment must be between -50% and +100%");
        }
        s.setSeasonName(r.seasonName() == null || r.seasonName().isBlank() ? "Peak season" : r.seasonName().trim());
        s.setSeasonStart(r.seasonStart());
        s.setSeasonEnd(r.seasonEnd());
        s.setSeasonalAdjustmentPercent(adj);
    }

    private void applyCustom(CustomPackage c, TourPackageRequest r) {
        if (r.extraDayPrice() == null || r.extraDayPrice().signum() <= 0) {
            throw new BusinessException("Custom packages need a price per extra day greater than zero");
        }
        if (r.maxExtraDays() == null || r.maxExtraDays() < 1 || r.maxExtraDays() > 14) {
            throw new BusinessException("Custom packages allow between 1 and 14 extra days");
        }
        c.setExtraDayPrice(r.extraDayPrice());
        c.setMaxExtraDaysAllowed(r.maxExtraDays());
    }

    private List<PackageItineraryDay> itinerary(List<ItineraryDayDto> days, int durationDays) {
        if (days == null) {
            return List.of();
        }
        Set<Integer> seen = new HashSet<>();
        for (ItineraryDayDto d : days) {
            if (d.dayNumber() > durationDays) {
                throw new BusinessException("Itinerary day " + d.dayNumber() + " is beyond the tour length of " + durationDays + " days");
            }
            if (!seen.add(d.dayNumber())) {
                throw new BusinessException("Itinerary day " + d.dayNumber() + " is listed twice");
            }
        }
        return days.stream()
                .sorted((a, b) -> Integer.compare(a.dayNumber(), b.dayNumber()))
                .map(d -> new PackageItineraryDay(d.dayNumber(), d.title().trim(), d.description(), d.location(), d.route()))
                .toList();
    }
}
