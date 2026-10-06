package com.project.webbasedtourismandtravelmanagementsystem.partner.repository;

import com.project.webbasedtourismandtravelmanagementsystem.partner.model.ServiceRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRateRepository extends JpaRepository<ServiceRate, Long> {

    List<ServiceRate> findBySupplierIdOrderByServiceNameAscVersionDesc(Long supplierId);

    Optional<ServiceRate> findFirstBySupplierIdAndServiceNameIgnoreCaseAndStatus(Long supplierId, String serviceName, ServiceRate.Status status);

    Optional<ServiceRate> findFirstBySupplierIdAndServiceNameIgnoreCaseOrderByVersionDesc(Long supplierId, String serviceName);

    List<ServiceRate> findByStatusOrderByCreatedAtAsc(ServiceRate.Status status);

    long countByStatus(ServiceRate.Status status);
}
