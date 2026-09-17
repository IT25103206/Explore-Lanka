package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository;


import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface TourPackageRepository
        extends JpaRepository<TourPackage, Long> {


}