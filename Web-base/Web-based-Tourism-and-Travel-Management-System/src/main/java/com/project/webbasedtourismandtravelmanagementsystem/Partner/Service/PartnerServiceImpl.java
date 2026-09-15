package com.project.webbasedtourismandtravelmanagementsystem.Partner.Service;


import com.project.webbasedtourismandtravelmanagementsystem.Partner.Model.Partner;
import com.project.webbasedtourismandtravelmanagementsystem.Partner.Repository.Partner_Repository;


import org.springframework.stereotype.Service;


import java.util.List;



@Service
public class PartnerServiceImpl
        implements PartnerService {



    private final Partner_Repository partnerRepository;



    public PartnerServiceImpl(
            Partner_Repository partnerRepository) {

        this.partnerRepository = partnerRepository;
    }





    @Override
    public Partner createPartner(Partner partner) {

        return partnerRepository.save(partner);

    }





    @Override
    public List<Partner> getAllPartners() {

        return partnerRepository.findAll();

    }





    @Override
    public Partner getPartnerById(Long id) {


        return partnerRepository.findById(id)

                .orElseThrow(() ->
                        new RuntimeException(
                                "Partner not found"));

    }





    @Override
    public Partner updatePartner(
            Long id,
            Partner partner) {


        Partner existing =
                getPartnerById(id);



        existing.setPartnerName(
                partner.getPartnerName());


        existing.setPartnerType(
                partner.getPartnerType());


        existing.setEmail(
                partner.getEmail());


        existing.setPhone(
                partner.getPhone());


        existing.setAddress(
                partner.getAddress());


        existing.setStatus(
                partner.getStatus());



        return partnerRepository.save(existing);

    }





    @Override
    public void deletePartner(Long id) {


        partnerRepository.deleteById(id);

    }

}