package com.project.webbasedtourismandtravelmanagementsystem.promotion.repository;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCouponCodeIgnoreCase(String couponCode);

    boolean existsByCouponCodeIgnoreCase(String couponCode);

    List<Promotion> findAllByOrderByCreatedAtDesc();

    List<Promotion> findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateAsc(
            Promotion.Status status, LocalDate today1, LocalDate today2);

    List<Promotion> findByStatusInAndEndDateBefore(List<Promotion.Status> statuses, LocalDate date);
}
