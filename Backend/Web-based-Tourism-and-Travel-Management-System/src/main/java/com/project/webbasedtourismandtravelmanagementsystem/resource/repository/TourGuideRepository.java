package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.TourGuide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TourGuideRepository extends JpaRepository<TourGuide, Long> {

    List<TourGuide> findAllByOrderByFullNameAsc();

    List<TourGuide> findByActiveTrueOrderByPricePerDayAsc();

    Optional<TourGuide> findByUserId(Long userId);

    List<TourGuide> findBySupplierIdOrderByFullNameAsc(Long supplierId);

    boolean existsByLicenseNoIgnoreCase(String licenseNo);
}
