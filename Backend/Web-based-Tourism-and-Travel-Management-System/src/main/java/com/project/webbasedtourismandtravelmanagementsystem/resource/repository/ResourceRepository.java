package com.project.webbasedtourismandtravelmanagementsystem.resource.repository;

import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;



@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    boolean existsByPartner_PartnerId(Long partnerId);

    Optional<Resource> findByRegistrationNumberIgnoreCase(String registrationNumber);

}
