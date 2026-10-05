package com.project.webbasedtourismandtravelmanagementsystem.partner.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.partner.dto.PartnerDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.ServiceRate;
import com.project.webbasedtourismandtravelmanagementsystem.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Partner contract & rate management UI backend (UC-02). */
@RestController
public class PartnerController {

    private final PartnerService partnerService;
    private final CurrentUser currentUser;

    public PartnerController(PartnerService partnerService, CurrentUser currentUser) {
        this.partnerService = partnerService;
        this.currentUser = currentUser;
    }

    // ---- supplier records (Business Manager); the list is also readable by Logistic Supplier Management
    //      because the hotel / vehicle forms need it for the supplier dropdown
    @GetMapping("/api/admin/suppliers")
    @PreAuthorize(Access.PARTNERS + " or " + Access.OPERATIONS)
    public List<SupplierResponse> list() {
        return partnerService.list();
    }

    @GetMapping("/api/admin/suppliers/{id}")
    @PreAuthorize(Access.PARTNERS)
    public SupplierResponse get(@PathVariable Long id) {
        return partnerService.get(id);
    }

    @PostMapping("/api/admin/suppliers")
    @PreAuthorize(Access.PARTNERS)
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierResponse create(@Valid @RequestBody SupplierRequest request) {
        return partnerService.save(null, request);
    }

    @PutMapping("/api/admin/suppliers/{id}")
    @PreAuthorize(Access.PARTNERS)
    public SupplierResponse update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return partnerService.save(id, request);
    }

    @PatchMapping("/api/admin/suppliers/{id}/status")
    @PreAuthorize(Access.PARTNERS)
    public SupplierResponse status(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return partnerService.changeStatus(id, request.status());
    }

    @DeleteMapping("/api/admin/suppliers/{id}")
    @PreAuthorize(Access.PARTNERS)
    public MessageResponse delete(@PathVariable Long id) {
        partnerService.delete(id);
        return MessageResponse.of("Supplier removed");
    }

    // ---- contracts
    @GetMapping("/api/admin/suppliers/{id}/contracts")
    @PreAuthorize(Access.PARTNERS)
    public List<ContractResponse> contracts(@PathVariable Long id) {
        return partnerService.contracts(id);
    }

    @PostMapping("/api/admin/suppliers/{id}/contracts")
    @PreAuthorize(Access.PARTNERS)
    @ResponseStatus(HttpStatus.CREATED)
    public ContractResponse newContract(@PathVariable Long id, @Valid @RequestBody ContractRequest request) {
        return partnerService.newContractVersion(id, request, currentUser.details().getFullName());
    }

    // ---- service rates
    @GetMapping("/api/admin/suppliers/{id}/rates")
    @PreAuthorize(Access.PARTNERS)
    public List<RateResponse> rates(@PathVariable Long id) {
        return partnerService.rates(id);
    }

    @PostMapping("/api/admin/suppliers/{id}/rates")
    @PreAuthorize(Access.PARTNERS)
    public MessageResponse proposeRate(@PathVariable Long id, @Valid @RequestBody RateRequest request) {
        RateResponse rate = partnerService.proposeRate(id, request, currentUser.details().getFullName());
        String msg = rate.status() == ServiceRate.Status.PENDING_APPROVAL
                ? "The change is more than 20% and has been sent to the System Administrator for approval"
                : "Service rate updated successfully";
        return MessageResponse.of(msg, rate);
    }

    @GetMapping("/api/admin/rates/pending")
    @PreAuthorize(Access.PARTNERS)
    public List<RateResponse> pending() {
        return partnerService.pendingRates();
    }

    @PostMapping("/api/admin/rates/{rateId}/decision")
    @PreAuthorize(Access.ADMIN)
    public MessageResponse decide(@PathVariable Long rateId, @Valid @RequestBody RateDecision request) {
        RateResponse rate = partnerService.decide(rateId, request.approve(), request.note(), currentUser.details().getFullName());
        return MessageResponse.of(request.approve() ? "Rate change approved" : "Rate change rejected", rate);
    }

    // ---- logistic partner: view own contract terms and rates
    @GetMapping("/api/partner/agreement")
    @PreAuthorize("hasAnyRole('HOTEL_PARTNER','TRANSPORT_PROVIDER')")
    public PartnerAgreement agreement() {
        return partnerService.agreementFor(currentUser.entity());
    }
}
