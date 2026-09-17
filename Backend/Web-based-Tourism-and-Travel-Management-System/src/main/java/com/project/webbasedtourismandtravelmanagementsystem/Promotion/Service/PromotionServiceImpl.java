package com.project.webbasedtourismandtravelmanagementsystem.Promotion.Service;

import com.project.webbasedtourismandtravelmanagementsystem.Promotion.Model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.Promotion.Repository.Promotion_Repository;

import org.springframework.stereotype.Service;

import java.util.List;


    @Service
    public class PromotionServiceImpl
            implements Promotion_Service {


        private final Promotion_Repository promotionRepository;


        public PromotionServiceImpl(
                Promotion_Repository promotionRepository) {

            this.promotionRepository = promotionRepository;
        }



        @Override
        public Promotion createPromotion(Promotion promotion) {

            return promotionRepository.save(promotion);
        }



        @Override
        public List<Promotion> getAllPromotions() {

            return promotionRepository.findAll();
        }



        @Override
        public Promotion getPromotionById(Long id) {

            return promotionRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Promotion not found"));
        }



        @Override
        public Promotion updatePromotion(
                Long id,
                Promotion promotion) {


            Promotion existing =
                    getPromotionById(id);


            existing.setTitle(
                    promotion.getTitle());

            existing.setDescription(
                    promotion.getDescription());

            existing.setDiscountPercentage(
                    promotion.getDiscountPercentage());

            existing.setStartDate(
                    promotion.getStartDate());

            existing.setEndDate(
                    promotion.getEndDate());

            existing.setStatus(
                    promotion.getStatus());


            return promotionRepository.save(existing);
        }



        @Override
        public void deletePromotion(Long id) {

            promotionRepository.deleteById(id);
        }
    }

