package com.project.webbasedtourismandtravelmanagementsystem.auth.repository;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRoleAndActiveTrue(Role role);

    List<User> findBySupplierIdAndActiveTrue(Long supplierId);

    List<User> findAllByOrderByCreatedAtDesc();

    long countByRole(Role role);
}
