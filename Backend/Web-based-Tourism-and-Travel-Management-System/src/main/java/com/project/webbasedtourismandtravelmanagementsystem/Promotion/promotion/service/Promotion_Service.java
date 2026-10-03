package com.project.webbasedtourismandtravelmanagementsystem.promotion.service;


import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import java.util.List;

public interface Promotion_Service {

        Promotion createPromotion(Promotion promotion);


        List<Promotion> getAllPromotions();


        Promotion getPromotionById(Long id);


        Promotion updatePromotion(Long id, Promotion promotion);


        void deletePromotion(Long id);


}
