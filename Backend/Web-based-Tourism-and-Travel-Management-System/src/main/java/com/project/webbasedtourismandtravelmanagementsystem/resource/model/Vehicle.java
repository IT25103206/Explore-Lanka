package com.project.webbasedtourismandtravelmanagementsystem.resource.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle extends BaseEntity {

    public enum Type { CAR, SUV, VAN, MINI_COACH, COACH, TUK_TUK }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    private Type type;

    @Column(nullable = false, length = 80)
    private String model;

    @Column(name = "registration_no", nullable = false, unique = true, length = 20)
    private String registrationNo;

    /** Passenger seats (excluding the driver). */
    @Column(nullable = false)
    private int seats;

    @Column(name = "price_per_day", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerDay;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "air_conditioned", nullable = false)
    private boolean airConditioned = true;

    @Column(nullable = false)
    private boolean active = true;

    public String label() {
        return model + " (" + type.name().replace('_', ' ') + ", " + seats + " seats)";
    }
}
