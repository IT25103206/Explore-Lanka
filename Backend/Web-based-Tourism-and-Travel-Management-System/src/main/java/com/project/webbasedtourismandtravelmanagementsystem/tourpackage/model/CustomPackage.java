package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A customisable tour plan: tourists may add extra days, charged per traveller per day. */
@Entity
@DiscriminatorValue("CUSTOM")
@Getter
@Setter
public class CustomPackage extends TourPackage {

    @Column(name = "extra_day_price", precision = 12, scale = 2)
    private BigDecimal extraDayPrice;

    @Column(name = "max_extra_days")
    private Integer maxExtraDaysAllowed;

    @Override
    public PackageType getPackageType() {
        return PackageType.CUSTOM;
    }

    @Override
    public BigDecimal pricePerAdult(LocalDate travelDate) {
        return getBasePrice();
    }

    @Override
    public BigDecimal extraDaysCost(int extraDays, int travellers) {
        if (extraDays <= 0 || extraDayPrice == null) {
            return BigDecimal.ZERO;
        }
        return extraDayPrice.multiply(BigDecimal.valueOf((long) extraDays * travellers));
    }

    @Override
    public int maxExtraDays() {
        return maxExtraDaysAllowed == null ? 0 : maxExtraDaysAllowed;
    }
}
