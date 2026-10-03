package com.project.webbasedtourismandtravelmanagementsystem.promotion.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.dto.PromotionDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PromotionController {

    private final PromotionService promotionService;
    private final CurrentUser currentUser;

    public PromotionController(PromotionService promotionService, CurrentUser currentUser) {
        this.promotionService = promotionService;
        this.currentUser = currentUser;
    }

    @GetMapping("/api/public/promotions")
    public List<PromotionResponse> activeOffers() {
        return promotionService.activeOffers();
    }

    @GetMapping("/api/admin/promotions")
    @PreAuthorize(Access.MARKETING)
    public List<PromotionResponse> list() {
        return promotionService.listAll();
    }

    @GetMapping("/api/admin/promotions/performance")
    @PreAuthorize(Access.MARKETING)
    public List<PromotionPerformance> performance() {
        return promotionService.performance();
    }

    @GetMapping("/api/admin/promotions/{id}")
    @PreAuthorize(Access.MARKETING)
    public PromotionResponse get(@PathVariable Long id) {
        return promotionService.get(id);
    }

    @PostMapping("/api/admin/promotions")
    @PreAuthorize(Access.MARKETING)
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionResponse create(@Valid @RequestBody PromotionRequest request) {
        return promotionService.create(request, currentUser.details().getFullName());
    }

    @PutMapping("/api/admin/promotions/{id}")
    @PreAuthorize(Access.MARKETING)
    public PromotionResponse update(@PathVariable Long id, @Valid @RequestBody PromotionRequest request) {
        return promotionService.update(id, request);
    }

    @PostMapping("/api/admin/promotions/{id}/publish")
    @PreAuthorize(Access.MARKETING)
    public PromotionResponse publish(@PathVariable Long id) {
        return promotionService.publish(id);
    }

    @PostMapping("/api/admin/promotions/{id}/deactivate")
    @PreAuthorize(Access.MARKETING)
    public PromotionResponse deactivate(@PathVariable Long id) {
        return promotionService.deactivate(id);
    }

    @DeleteMapping("/api/admin/promotions/{id}")
    @PreAuthorize(Access.MARKETING)
    public MessageResponse delete(@PathVariable Long id) {
        promotionService.delete(id);
        return MessageResponse.of("Promotion deleted");
    }
}
