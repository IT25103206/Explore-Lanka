package com.project.webbasedtourismandtravelmanagementsystem.partner.repository;

import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findAllByOrderByNameAsc();

    List<Supplier> findByStatusOrderByNameAsc(Supplier.Status status);

    long countByStatus(Supplier.Status status);
}
