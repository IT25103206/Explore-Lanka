package com.project.webbasedtourismandtravelmanagementsystem.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Serves the public HTML pages moved to templates without a template-engine dependency. */
@RestController
public class TemplatePageController {

    @GetMapping(value = {
            "/", "/index.html", "/index-new.html", "/login.html", "/staff-login.html",
            "/forgot-password.html", "/reset-password.html", "/events.html", "/offers.html",
            "/packages.html", "/tour.html",
            "/admin/allocations.html", "/admin/bookings.html", "/admin/dashboard.html",
            "/admin/events.html", "/admin/feedback.html", "/admin/guides.html",
            "/admin/invoice.html", "/admin/notifications.html", "/admin/packages.html",
            "/admin/partners.html", "/admin/payments.html", "/admin/profile.html",
            "/admin/promotions.html", "/admin/reports.html", "/admin/resources.html",
            "/admin/schedule.html", "/admin/users.html",
            "/customer/book.html", "/customer/bookings.html", "/customer/dashboard.html",
            "/customer/events.html", "/customer/festivals.html", "/customer/invoice.html",
            "/customer/notifications.html", "/customer/offers.html", "/customer/packages.html",
            "/customer/pay.html", "/customer/payments.html", "/customer/profile.html",
            "/customer/reviews.html", "/customer/wishlist.html"
    }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> page(HttpServletRequest request) {
        String path = request.getServletPath();
        String filename = "/".equals(path) ? "index.html" : path.substring(1);
        Resource page = new ClassPathResource("templates/" + filename);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
                .body(page);
    }
}
