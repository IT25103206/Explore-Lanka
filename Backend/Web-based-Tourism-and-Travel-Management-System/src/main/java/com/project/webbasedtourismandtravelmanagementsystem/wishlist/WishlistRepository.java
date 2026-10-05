package com.project.webbasedtourismandtravelmanagementsystem.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<WishlistItem> findByCustomerIdAndTourPackageId(Long customerId, Long packageId);

    boolean existsByCustomerIdAndTourPackageId(Long customerId, Long packageId);

    long countByCustomerId(Long customerId);
}
