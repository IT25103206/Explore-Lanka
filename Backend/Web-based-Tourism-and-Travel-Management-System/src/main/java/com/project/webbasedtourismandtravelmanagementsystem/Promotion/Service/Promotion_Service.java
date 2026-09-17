package com.project.webbasedtourismandtravelmanagementsystem.Promotion.Service;


import com.project.webbasedtourismandtravelmanagementsystem.Promotion.Model.Promotion;
import java.util.List;

public interface Promotion_Service {

        Promotion createPromotion(Promotion promotion);


        List<Promotion> getAllPromotions();


        Promotion getPromotionById(Long id);


        Promotion updatePromotion(Long id, Promotion promotion);


        void deletePromotion(Long id);


}
