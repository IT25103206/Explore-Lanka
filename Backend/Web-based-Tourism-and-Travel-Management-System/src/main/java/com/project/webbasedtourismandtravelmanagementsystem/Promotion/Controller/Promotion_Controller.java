package com.project.webbasedtourismandtravelmanagementsystem.Promotion.Controller;


import com.project.webbasedtourismandtravelmanagementsystem.Promotion.Model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.Promotion.Service.Promotion_Service;

import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/promotions")
@CrossOrigin
public class Promotion_Controller {



    private final Promotion_Service promotionService;



    public Promotion_Controller(
            Promotion_Service promotionService) {

        this.promotionService = promotionService;
    }



    // CREATE

    @PostMapping
    public Promotion createPromotion(
            @RequestBody Promotion promotion) {

        return promotionService
                .createPromotion(promotion);
    }



    // READ ALL

    @GetMapping
    public List<Promotion> getAllPromotions(){

        return promotionService
                .getAllPromotions();
    }



    // READ ONE

    @GetMapping("/{id}")
    public Promotion getPromotion(
            @PathVariable Long id){

        return promotionService
                .getPromotionById(id);
    }



    // UPDATE

    @PutMapping("/{id}")
    public Promotion updatePromotion(
            @PathVariable Long id,
            @RequestBody Promotion promotion){

        return promotionService
                .updatePromotion(id,promotion);
    }



    // DELETE

    @DeleteMapping("/{id}")
    public String deletePromotion(
            @PathVariable Long id){

        promotionService.deletePromotion(id);

        return "Promotion deleted successfully";
    }

}