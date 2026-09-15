package com.project.webbasedtourismandtravelmanagementsystem.Partner.Service;


import com.project.webbasedtourismandtravelmanagementsystem.Partner.Model.Partner;

import java.util.List;



public interface PartnerService {


    Partner createPartner(Partner partner);


    List<Partner> getAllPartners();


    Partner getPartnerById(Long id);


    Partner updatePartner(Long id, Partner partner);


    void deletePartner(Long id);

}