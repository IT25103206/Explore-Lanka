package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    List<Hotel> findAllByOrderByCityAscNameAsc();

    List<Hotel> findByActiveTrueOrderByPricePerNightAsc();

    List<Hotel> findBySupplierIdOrderByNameAsc(Long supplierId);
}
