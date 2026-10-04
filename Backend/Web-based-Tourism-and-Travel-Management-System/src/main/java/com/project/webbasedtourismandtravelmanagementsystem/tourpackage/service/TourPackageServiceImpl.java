package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service;

import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TourPackageServiceImpl implements TourPackageService {

    private final TourPackageRepository tourPackageRepository;

    public TourPackageServiceImpl(
            TourPackageRepository tourPackageRepository) {

        this.tourPackageRepository = tourPackageRepository;
    }


    // =========================================================
    // CREATE PACKAGE
    // =========================================================

    @Override
    public TourPackage createPackage(
            TourPackage tourPackage) {

        return tourPackageRepository.save(
                tourPackage
        );
    }


    // =========================================================
    // GET ALL PACKAGES
    // =========================================================

    @Override
    public List<TourPackage> getAllPackages() {

        return tourPackageRepository.findAll();
    }


    // =========================================================
    // GET PACKAGE BY ID
    // =========================================================

    @Override
    public TourPackage getPackageById(
            Long id) {

        return tourPackageRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Tour Package not found"
                        )
                );
    }


    // =========================================================
    // UPDATE PACKAGE
    // =========================================================

    @Override
    public TourPackage updatePackage(
            Long id,
            TourPackage tourPackage) {

        TourPackage existing =
                getPackageById(id);


        // Package name
        existing.setName(
                tourPackage.getName()
        );


        // Description
        existing.setDescription(
                tourPackage.getDescription()
        );


        // Base price
        existing.setBasePrice(
                tourPackage.getBasePrice()
        );


        // Duration
        existing.setDurationDays(
                tourPackage.getDurationDays()
        );


        // Category
        existing.setCategory(
                tourPackage.getCategory()
        );


        // Status
        existing.setStatus(
                tourPackage.getStatus()
        );


        // Image
        existing.setImageUrl(
                tourPackage.getImageUrl()
        );


        // Code
        existing.setCode(
                tourPackage.getCode()
        );


        // Region
        existing.setRegion(
                tourPackage.getRegion()
        );


        // Destinations
        existing.setDestinations(
                tourPackage.getDestinations()
        );


        // Maximum group size
        existing.setMaxGroupSize(
                tourPackage.getMaxGroupSize()
        );


        // Guide recommended
        existing.setGuideRecommended(
                tourPackage.isGuideRecommended()
        );


        // Highlights
        existing.setHighlights(
                tourPackage.getHighlights()
        );


        // Inclusions
        existing.setInclusions(
                tourPackage.getInclusions()
        );


        // Exclusions
        existing.setExclusions(
                tourPackage.getExclusions()
        );


        // Available from
        existing.setAvailableFrom(
                tourPackage.getAvailableFrom()
        );


        // Available to
        existing.setAvailableTo(
                tourPackage.getAvailableTo()
        );


        return tourPackageRepository.save(
                existing
        );
    }


    // =========================================================
    // DELETE PACKAGE
    // =========================================================

    @Override
    public void deletePackage(
            Long id) {

        if (!tourPackageRepository.existsById(id)) {

            throw new RuntimeException(
                    "Tour Package not found"
            );
        }

        tourPackageRepository.deleteById(
                id
        );
    }
}