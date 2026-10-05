package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceBlockedDate;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ResourceBlockedDateRepository extends JpaRepository<ResourceBlockedDate, Long> {

    List<ResourceBlockedDate> findByResourceTypeAndResourceIdAndDateBetweenOrderByDateAsc(ResourceType type, Long resourceId, LocalDate from, LocalDate to);

    List<ResourceBlockedDate> findByResourceTypeAndResourceIdAndDateGreaterThanEqualOrderByDateAsc(ResourceType type, Long resourceId, LocalDate from);

    Optional<ResourceBlockedDate> findByResourceTypeAndResourceIdAndDate(ResourceType type, Long resourceId, LocalDate date);
}
