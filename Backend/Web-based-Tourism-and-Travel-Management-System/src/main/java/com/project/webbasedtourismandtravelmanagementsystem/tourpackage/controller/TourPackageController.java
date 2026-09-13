package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.controller;



import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageService;


import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/packages")
@CrossOrigin
public class TourPackageController {



    private final TourPackageService tourPackageService;



    public TourPackageController(
            TourPackageService tourPackageService) {

        this.tourPackageService = tourPackageService;
    }





    // CREATE PACKAGE

    @PostMapping
    public TourPackage createPackage(
            @RequestBody TourPackage tourPackage) {


        return tourPackageService
                .createPackage(tourPackage);
    }





    // GET ALL PACKAGES

    @GetMapping
    public List<TourPackage> getAllPackages() {


        return tourPackageService
                .getAllPackages();
    }





    // GET PACKAGE BY ID

    @GetMapping("/{id}")
    public TourPackage getPackageById(
            @PathVariable Long id) {


        return tourPackageService
                .getPackageById(id);
    }





    // UPDATE PACKAGE

    @PutMapping("/{id}")
    public TourPackage updatePackage(
            @PathVariable Long id,
            @RequestBody TourPackage tourPackage) {


        return tourPackageService
                .updatePackage(id, tourPackage);
    }





    // DELETE PACKAGE

    @DeleteMapping("/{id}")
    public String deletePackage(
            @PathVariable Long id) {


        tourPackageService.deletePackage(id);


        return "Tour package deleted successfully";
    }

}