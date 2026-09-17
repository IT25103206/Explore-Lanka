package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service;



import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;


import org.springframework.stereotype.Service;


import java.util.List;



@Service
public class TourPackageServiceImpl
        implements TourPackageService {



    private final TourPackageRepository tourPackageRepository;



    public TourPackageServiceImpl(
            TourPackageRepository tourPackageRepository) {

        this.tourPackageRepository = tourPackageRepository;
    }





    @Override
    public TourPackage createPackage(
            TourPackage tourPackage) {


        return tourPackageRepository.save(tourPackage);
    }





    @Override
    public List<TourPackage> getAllPackages() {


        return tourPackageRepository.findAll();
    }





    @Override
    public TourPackage getPackageById(Long id) {


        return tourPackageRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Tour Package not found"));
    }





    @Override
    public TourPackage updatePackage(
            Long id,
            TourPackage tourPackage) {


        TourPackage existing =
                getPackageById(id);



        existing.setPackageName(
                tourPackage.getPackageName());


        existing.setDescription(
                tourPackage.getDescription());


        existing.setPrice(
                tourPackage.getPrice());


        existing.setDurationDays(
                tourPackage.getDurationDays());


        existing.setCategory(
                tourPackage.getCategory());


        existing.setStatus(
                tourPackage.getStatus());



        return tourPackageRepository.save(existing);
    }





    @Override
    public void deletePackage(Long id) {


        tourPackageRepository.deleteById(id);

    }

}