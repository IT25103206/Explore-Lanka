package com.project.webbasedtourismandtravelmanagementsystem.wishlist;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageService;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Wishlist & Favourites: tourists save packages for later. */
@RestController
@RequestMapping("/api/customer/wishlist")
@PreAuthorize(Access.CUSTOMER)
public class WishlistController {

    public record AddRequest(@NotNull(message = "Package is required") Long packageId) {
    }

    public record WishlistResponse(Long packageId, String name, String imageUrl, String region, int durationDays,
                                   BigDecimal price, boolean bookable, LocalDateTime addedAt) {
        static WishlistResponse from(WishlistItem w) {
            TourPackage p = w.getTourPackage();
            return new WishlistResponse(p.getId(), p.getName(), p.getImageUrl(), p.getRegion(), p.getDurationDays(),
                    p.pricePerAdult(LocalDate.now()), p.isBookable(), w.getCreatedAt());
        }
    }

    private final WishlistRepository wishlistRepository;
    private final TourPackageService packageService;
    private final CurrentUser currentUser;

    public WishlistController(WishlistRepository wishlistRepository, TourPackageService packageService, CurrentUser currentUser) {
        this.wishlistRepository = wishlistRepository;
        this.packageService = packageService;
        this.currentUser = currentUser;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<WishlistResponse> list() {
        return wishlistRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.id()).stream()
                .map(WishlistResponse::from).toList();
    }

    @PostMapping
    @Transactional
    public MessageResponse add(@RequestBody @jakarta.validation.Valid AddRequest request) {
        TourPackage p = packageService.find(request.packageId());
        if (p.getStatus() != TourPackage.Status.ACTIVE) {
            throw new BusinessException("This package is no longer offered");
        }
        if (!wishlistRepository.existsByCustomerIdAndTourPackageId(currentUser.id(), p.getId())) {
            wishlistRepository.save(new WishlistItem(currentUser.entity(), p));
        }
        return MessageResponse.of(p.getName() + " saved to your wishlist");
    }

    @DeleteMapping("/{packageId}")
    @Transactional
    public MessageResponse remove(@PathVariable Long packageId) {
        wishlistRepository.findByCustomerIdAndTourPackageId(currentUser.id(), packageId).ifPresent(wishlistRepository::delete);
        return MessageResponse.of("Removed from your wishlist");
    }
}
