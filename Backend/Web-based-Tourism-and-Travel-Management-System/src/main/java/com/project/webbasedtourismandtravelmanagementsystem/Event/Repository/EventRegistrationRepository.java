package com.project.webbasedtourismandtravelmanagementsystem.event.repository;

import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    List<EventRegistration> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<EventRegistration> findByEventIdAndStatus(Long eventId, EventRegistration.Status status);

    Optional<EventRegistration> findByEventIdAndCustomerId(Long eventId, Long customerId);

    List<EventRegistration> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, EventRegistration.Status status);

    @Query("select coalesce(sum(r.participants), 0) from EventRegistration r where r.event.id = :eventId and r.status = 'REGISTERED'")
    long registeredParticipants(@Param("eventId") Long eventId);

    void deleteByEventId(Long eventId);
}
