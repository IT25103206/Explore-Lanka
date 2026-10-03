package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * A tour whose price changes inside a season (e.g. +15% during the Esala Perahera,
 * or -10% in the monsoon). The adjustment applies when the tour starts inside the season.
 */
@Entity
@DiscriminatorValue("SEASONAL")
@Getter
@Setter
public class SeasonalPackage extends TourPackage {

    @Column(name = "season_name", length = 60)
    private String seasonName;

    @Column(name = "season_start")
    private LocalDate seasonStart;

    @Column(name = "season_end")
    private LocalDate seasonEnd;

    /** Positive = surcharge, negative = discount, in percent. */
    @Column(name = "seasonal_adjustment", precision = 5, scale = 2)
    private BigDecimal seasonalAdjustmentPercent;

    @Override
    public PackageType getPackageType() {
        return PackageType.SEASONAL;
    }

    public boolean inSeason(LocalDate date) {
        return date != null && seasonStart != null && seasonEnd != null
                && !date.isBefore(seasonStart) && !date.isAfter(seasonEnd);
    }

    @Override
    public BigDecimal pricePerAdult(LocalDate travelDate) {
        if (!inSeason(travelDate) || seasonalAdjustmentPercent == null) {
            return getBasePrice();
        }
        BigDecimal factor = BigDecimal.ONE.add(seasonalAdjustmentPercent.movePointLeft(2));
        return getBasePrice().multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }
}
