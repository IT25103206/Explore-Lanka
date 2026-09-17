package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service;


import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;

import java.util.List;



public interface TourPackageService {


    TourPackage createPackage(TourPackage tourPackage);


    List<TourPackage> getAllPackages();


    TourPackage getPackageById(Long id);


    TourPackage updatePackage(Long id,
                              TourPackage tourPackage);


    void deletePackage(Long id);

}