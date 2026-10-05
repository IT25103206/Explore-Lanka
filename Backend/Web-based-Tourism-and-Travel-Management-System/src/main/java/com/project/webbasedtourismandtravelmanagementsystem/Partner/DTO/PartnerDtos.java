package com.project.webbasedtourismandtravelmanagementsystem.partner.dto;

import com.project.webbasedtourismandtravelmanagementsystem.partner.model.ServiceRate;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.SupplierContract;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.ResourceType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static com.project.webbasedtourismandtravelmanagementsystem.common.ValidationRules.*;

public final class PartnerDtos {

    private PartnerDtos() {
    }

    public record SupplierRequest(
            @NotBlank(message = "Supplier name is required") @Size(min = 2, max = 120) String name,
            @NotNull(message = "Choose the supplier type") Supplier.Type type,
            @Pattern(regexp = "^([A-Za-z][A-Za-z .'-]{1,99})?$", message = NAME_MSG) String contactPerson,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @Pattern(regexp = PHONE, message = PHONE_MSG) String phone,
            @Size(max = 255) String address,
            @Size(max = 500) String notes) {
    }

    public record StatusRequest(@NotNull(message = "Status is required") Supplier.Status status) {
    }

    public record SupplierResponse(Long id, String name, Supplier.Type type, String contactPerson, String email,
                                   String phone, String address, Supplier.Status status, String notes, int resources,
                                   Integer contractVersion, LocalDate contractEnd, BigDecimal commissionPercent,
                                   double averageRating, long ratingCount, long allocations, BigDecimal revenue,
                                   long pendingRates) {
    }

    public record ContractRequest(
            @NotNull(message = "Start date is required") LocalDate startDate,
            @NotNull(message = "End date is required") LocalDate endDate,
            @NotNull(message = "Commission is required") @DecimalMin(value = "0.00", message = "Commission cannot be negative")
            @DecimalMax(value = "50.00", message = "Commission cannot exceed 50%") BigDecimal commissionPercent,
            @Size(max = 120) String paymentTerms,
            @NotBlank(message = "Contract terms are required") @Size(min = 10, max = 2000, message = "Terms must be 10-2000 characters") String terms) {
    }

    public record ContractResponse(Long id, int version, LocalDate startDate, LocalDate endDate, BigDecimal commissionPercent,
                                   String paymentTerms, String terms, SupplierContract.Status status, String createdBy,
                                   LocalDateTime createdAt) {
        public static ContractResponse from(SupplierContract c) {
            return new ContractResponse(c.getId(), c.getVersion(), c.getStartDate(), c.getEndDate(), c.getCommissionPercent(),
                    c.getPaymentTerms(), c.getTerms(), c.getStatus(), c.getCreatedBy(), c.getCreatedAt());
        }
    }

    /** UC-02 step 3: new rate terms. Amount bounds cover "invalid rate format" (4a). */
    public record RateRequest(
            @NotBlank(message = "Service name is required") @Size(max = 120) String serviceName,
            @NotNull(message = "Choose a unit") ServiceRate.Unit unit,
            @NotNull(message = "Rate amount is required") @DecimalMin(value = "1.00", message = "Rate must be at least LKR 1")
            @DecimalMax(value = "10000000.00", message = "Rate cannot exceed LKR 10,000,000")
            @Digits(integer = 8, fraction = 2, message = "Use at most 2 decimal places") BigDecimal amount,
            @NotNull(message = "Effective date is required") LocalDate effectiveFrom,
            ResourceType resourceType,
            Long resourceId) {
    }

    public record RateResponse(Long id, Long supplierId, String supplierName, String serviceName, ServiceRate.Unit unit,
                               BigDecimal amount, BigDecimal previousAmount, BigDecimal changePercent, int version,
                               ServiceRate.Status status, LocalDate effectiveFrom, ResourceType resourceType, Long resourceId,
                               String requestedBy, String decidedBy, LocalDateTime decidedAt, String decisionNote,
                               LocalDateTime createdAt) {
        public static RateResponse from(ServiceRate r) {
            return new RateResponse(r.getId(), r.getSupplier().getId(), r.getSupplier().getName(), r.getServiceName(),
                    r.getUnit(), r.getAmount(), r.getPreviousAmount(), r.getChangePercent(), r.getVersion(), r.getStatus(),
                    r.getEffectiveFrom(), r.getResourceType(), r.getResourceId(), r.getRequestedBy(), r.getDecidedBy(),
                    r.getDecidedAt(), r.getDecisionNote(), r.getCreatedAt());
        }
    }

    public record RateDecision(boolean approve, @Size(max = 300) String note) {
    }

    /** What a logistic partner sees about their own agreement ("View updated contract terms"). */
    public record PartnerAgreement(SupplierResponse supplier, ContractResponse contract, List<RateResponse> rates) {
    }
}
