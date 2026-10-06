package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.controller;

import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto.TourPackageDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.PackageType;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageService;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageService.PackageFilter;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/** TourPackageController from the "Create Tour Package" sequence diagram. */
@RestController
public class TourPackageController {

    private final TourPackageService packageService;

    public TourPackageController(TourPackageService packageService) {
        this.packageService = packageService;
    }

    // ---------------------------------------------------------------- public catalogue

    @GetMapping("/api/public/packages")
    public List<TourPackageResponse> search(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) TourPackage.Category category,
                                            @RequestParam(required = false) String region,
                                            @RequestParam(required = false) PackageType type,
                                            @RequestParam(required = false) BigDecimal minPrice,
                                            @RequestParam(required = false) BigDecimal maxPrice,
                                            @RequestParam(required = false) Integer maxDays,
                                            @RequestParam(required = false) String sort) {
        return packageService.search(new PackageFilter(q, category, region, type, minPrice, maxPrice, maxDays, sort));
    }

    @GetMapping("/api/public/packages/{id}")
    public TourPackageResponse publicDetails(@PathVariable Long id) {
        return packageService.getPublic(id);
    }

    // ---------------------------------------------------------------- management

    @GetMapping("/api/admin/packages")
    @PreAuthorize(Access.STAFF)
    public List<TourPackageResponse> list() {
        return packageService.listAll();
    }

    @GetMapping("/api/admin/packages/options")
    @PreAuthorize(Access.STAFF)
    public List<PackageOption> options() {
        return packageService.options();
    }

    @GetMapping("/api/admin/packages/{id}")
    @PreAuthorize(Access.STAFF)
    public TourPackageResponse get(@PathVariable Long id) {
        return packageService.get(id);
    }

    @PostMapping("/api/admin/packages")
    @PreAuthorize(Access.PACKAGES)
    @ResponseStatus(HttpStatus.CREATED)
    public TourPackageResponse create(@Valid @RequestBody TourPackageRequest request) {
        return packageService.create(request);
    }

    @PutMapping("/api/admin/packages/{id}")
    @PreAuthorize(Access.PACKAGES)
    public TourPackageResponse update(@PathVariable Long id, @Valid @RequestBody TourPackageRequest request) {
        return packageService.update(id, request);
    }

    @PatchMapping("/api/admin/packages/{id}/status")
    @PreAuthorize(Access.PACKAGES)
    public TourPackageResponse changeStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return packageService.changeStatus(id, request.status());
    }

    @DeleteMapping("/api/admin/packages/{id}")
    @PreAuthorize(Access.PACKAGES)
    public MessageResponse delete(@PathVariable Long id) {
        packageService.delete(id);
        return MessageResponse.of("Package deleted");
    }
}
