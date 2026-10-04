package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findAllByOrderBySeatsAscModelAsc();

    List<Vehicle> findByActiveTrueOrderBySeatsAscPricePerDayAsc();

    List<Vehicle> findBySupplierIdOrderByModelAsc(Long supplierId);

    boolean existsByRegistrationNoIgnoreCase(String registrationNo);
}
