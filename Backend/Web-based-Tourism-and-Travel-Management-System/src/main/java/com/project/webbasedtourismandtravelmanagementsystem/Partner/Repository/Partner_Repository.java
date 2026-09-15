package com.project.webbasedtourismandtravelmanagementsystem.Partner.Repository;


import com.project.webbasedtourismandtravelmanagementsystem.Partner.Model.Partner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface Partner_Repository
        extends JpaRepository<Partner, Long> {


}