package com.project.webbasedtourismandtravelmanagementsystem.partner.repository;

import com.project.webbasedtourismandtravelmanagementsystem.partner.model.SupplierContract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplierContractRepository extends JpaRepository<SupplierContract, Long> {

    List<SupplierContract> findBySupplierIdOrderByVersionDesc(Long supplierId);

    Optional<SupplierContract> findFirstBySupplierIdAndStatus(Long supplierId, SupplierContract.Status status);

    Optional<SupplierContract> findFirstBySupplierIdOrderByVersionDesc(Long supplierId);
}
