package com.project.webbasedtourismandtravelmanagementsystem.Partner.Controller;


import com.project.webbasedtourismandtravelmanagementsystem.Partner.Model.Partner;
import com.project.webbasedtourismandtravelmanagementsystem.Partner.Service.PartnerService;


import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/partners")
@CrossOrigin
public class Partner_Controller {



    private final PartnerService partnerService;



    public Partner_Controller(
            PartnerService partnerService) {

        this.partnerService = partnerService;
    }





    // CREATE PARTNER

    @PostMapping
    public Partner createPartner(
            @RequestBody Partner partner) {


        return partnerService
                .createPartner(partner);

    }





    // GET ALL PARTNERS

    @GetMapping
    public List<Partner> getAllPartners() {


        return partnerService
                .getAllPartners();

    }





    // GET PARTNER BY ID

    @GetMapping("/{id}")
    public Partner getPartnerById(
            @PathVariable Long id) {


        return partnerService
                .getPartnerById(id);

    }





    // UPDATE PARTNER

    @PutMapping("/{id}")
    public Partner updatePartner(
            @PathVariable Long id,
            @RequestBody Partner partner) {


        return partnerService
                .updatePartner(id, partner);

    }





    // DELETE PARTNER

    @DeleteMapping("/{id}")
    public String deletePartner(
            @PathVariable Long id) {


        partnerService.deletePartner(id);


        return "Partner deleted successfully";

    }

}