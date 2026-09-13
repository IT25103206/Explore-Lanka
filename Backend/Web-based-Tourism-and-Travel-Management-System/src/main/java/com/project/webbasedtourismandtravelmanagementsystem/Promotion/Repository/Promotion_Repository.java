package com.project.webbasedtourismandtravelmanagementsystem.Promotion.Repository;

import com.project.webbasedtourismandtravelmanagementsystem.Promotion.Model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface Promotion_Repository
        extends JpaRepository<Promotion, Long> {


}
