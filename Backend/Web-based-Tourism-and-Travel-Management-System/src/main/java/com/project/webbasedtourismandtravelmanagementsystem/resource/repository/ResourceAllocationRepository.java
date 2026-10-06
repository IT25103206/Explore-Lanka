package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceAllocation;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface ResourceAllocationRepository extends JpaRepository<ResourceAllocation, Long> {

    List<ResourceAllocation> findByBookingIdAndStatus(Long bookingId, ResourceAllocation.Status status);

    List<ResourceAllocation> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    /** Active allocations of one resource that overlap [start, end] - the double-booking check. */
    @Query("""
            select a from ResourceAllocation a
            where a.resourceType = :type and a.resourceId = :resourceId
              and a.status = :status
              and a.startDate <= :endDate and a.endDate >= :startDate
            """)
    List<ResourceAllocation> findOverlapping(@Param("type") ResourceType type,
                                             @Param("resourceId") Long resourceId,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate,
                                             @Param("status") ResourceAllocation.Status status);

    List<ResourceAllocation> findByResourceTypeAndResourceIdInAndStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(
            ResourceType type, Collection<Long> resourceIds, ResourceAllocation.Status status, LocalDate from);

    List<ResourceAllocation> findByResourceTypeAndResourceIdAndStatus(ResourceType type, Long resourceId, ResourceAllocation.Status status);

    boolean existsByResourceTypeAndResourceId(ResourceType type, Long resourceId);

    long countByResourceTypeAndResourceIdIn(ResourceType type, Collection<Long> resourceIds);

    List<ResourceAllocation> findByStatus(ResourceAllocation.Status status);
}
