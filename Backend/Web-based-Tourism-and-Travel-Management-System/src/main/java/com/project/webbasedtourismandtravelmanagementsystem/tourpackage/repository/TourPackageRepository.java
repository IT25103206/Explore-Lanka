package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository;

import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourPackageRepository extends JpaRepository<TourPackage, Long> {

    List<TourPackage> findAllByOrderByCreatedAtDesc();

    List<TourPackage> findByStatusOrderByNameAsc(TourPackage.Status status);

    boolean existsByCodeIgnoreCase(String code);

    long countByStatus(TourPackage.Status status);
}
