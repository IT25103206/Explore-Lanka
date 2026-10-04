package com.project.webbasedtourismandtravelmanagementsystem.promotion.repository;

import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface Promotion_Repository
        extends JpaRepository<Promotion, Long> {


}
