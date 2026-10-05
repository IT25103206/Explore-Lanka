package com.project.webbasedtourismandtravelmanagementsystem.report;

import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.report.ReportService.DashboardResponse;
import com.project.webbasedtourismandtravelmanagementsystem.report.ReportService.RecordsResponse;
import com.project.webbasedtourismandtravelmanagementsystem.report.ReportService.ReportResponse;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/api/admin/dashboard")
    @PreAuthorize(Access.STAFF)
    public DashboardResponse dashboard() {
        return reportService.dashboard();
    }

    @GetMapping("/api/admin/reports/summary")
    @PreAuthorize(Access.REPORTS)
    public ReportResponse report(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                 @RequestParam(required = false) TourPackage.Category category) {
        return reportService.report(from, to, category);
    }

    @GetMapping("/api/admin/reports/records")
    @PreAuthorize(Access.REPORTS)
    public RecordsResponse records(@RequestParam(required = false) TourPackage.Category category,
                                   @RequestParam(required = false) Supplier.Type supplierType) {
        return reportService.records(category, supplierType);
    }
}
