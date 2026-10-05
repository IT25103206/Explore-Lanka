package com.project.webbasedtourismandtravelmanagementsystem.wishlist;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wishlist",
        uniqueConstraints = @UniqueConstraint(name = "uk_wishlist", columnNames = {"customer_id", "package_id"}))
@Getter
@Setter
@NoArgsConstructor
public class WishlistItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private TourPackage tourPackage;

    public WishlistItem(User customer, TourPackage tourPackage) {
        this.customer = customer;
        this.tourPackage = tourPackage;
    }
}
