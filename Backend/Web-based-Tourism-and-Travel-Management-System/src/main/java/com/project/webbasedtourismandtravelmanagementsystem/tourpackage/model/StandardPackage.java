package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A fixed-price tour, the same price all year. */
@Entity
@DiscriminatorValue("STANDARD")
public class StandardPackage extends TourPackage {

    @Override
    public PackageType getPackageType() {
        return PackageType.STANDARD;
    }

    @Override
    public BigDecimal pricePerAdult(LocalDate travelDate) {
        return getBasePrice();
    }
}
