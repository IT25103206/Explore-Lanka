package com.project.webbasedtourismandtravelmanagementsystem.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

/**
 * The old interface used /ui/customer-*, /ui/admin-* and /admin/login links. Those pages are not
 * served by this backend, so every old link is redirected to the matching working page.
 */
@RestController
public class LegacyRouteController {

    private static final Set<String> ADMIN_PAGES = Set.of("allocations", "bookings", "dashboard", "events", "feedback",
            "guides", "invoice", "notifications", "packages", "partners", "payments", "profile", "promotions",
            "reports", "resources", "schedule", "users");

    private static final Map<String, String> ADMIN_ALIASES = Map.of(
            "approvals", "partners",
            "staff", "users");

    private static final Map<String, String> CUSTOMER_PAGES = Map.ofEntries(
            Map.entry("dashboard", "/customer/dashboard.html"),
            Map.entry("bookings", "/customer/bookings.html"),
            Map.entry("booking", "/customer/bookings.html"),
            Map.entry("booking-details", "/customer/bookings.html"),
            Map.entry("my-trips", "/customer/bookings.html"),
            Map.entry("payment-history", "/customer/payments.html"),
            Map.entry("payments", "/customer/payments.html"),
            Map.entry("payment", "/customer/payments.html"),
            Map.entry("refunds", "/customer/payments.html"),
            Map.entry("wishlist", "/customer/wishlist.html"),
            Map.entry("saved-trips", "/customer/wishlist.html"),
            Map.entry("reviews", "/customer/reviews.html"),
            Map.entry("complaints", "/customer/reviews.html"),
            Map.entry("notifications", "/customer/notifications.html"),
            Map.entry("messages", "/customer/notifications.html"),
            Map.entry("profile", "/customer/profile.html"),
            Map.entry("events", "/customer/events.html"),
            Map.entry("event-details", "/customer/events.html"),
            Map.entry("offers", "/customer/offers.html"),
            Map.entry("tour-packages", "/customer/packages.html"),
            Map.entry("package-details", "/customer/packages.html"),
            Map.entry("destinations", "/customer/packages.html"),
            Map.entry("search", "/customer/packages.html"),
            Map.entry("search-results", "/customer/packages.html"),
            Map.entry("hotels", "/customer/packages.html"),
            Map.entry("transport", "/customer/packages.html"),
            Map.entry("tour-guides", "/customer/packages.html"),
            Map.entry("custom-tour", "/customer/packages.html"),
            Map.entry("travel-planner", "/customer/packages.html"),
            Map.entry("login", "/login.html"),
            Map.entry("register", "/login.html#register"));

    @GetMapping({"/admin/login", "/admin/login/", "/admin", "/admin/", "/staff-login"})
    public ResponseEntity<Void> adminLogin() {
        return redirect("/staff-login.html");
    }

    @GetMapping({"/login", "/register"})
    public ResponseEntity<Void> customerLogin(HttpServletRequest request) {
        return redirect(request.getRequestURI().endsWith("register") ? "/login.html#register" : "/login.html");
    }

    @GetMapping("/ui/{page:[a-z0-9-]+}")
    public ResponseEntity<Void> ui(@PathVariable String page, HttpServletRequest request) {
        String target;
        if (page.startsWith("admin-")) {
            String name = page.substring("admin-".length());
            name = ADMIN_ALIASES.getOrDefault(name, name);
            target = ADMIN_PAGES.contains(name) ? "/admin/" + name + ".html" : "/admin/dashboard.html";
        } else if (page.startsWith("customer-")) {
            String name = page.substring("customer-".length());
            target = CUSTOMER_PAGES.getOrDefault(name, "/customer/dashboard.html");
            if ("package-details".equals(name) && request.getParameter("id") != null) {
                target = "/tour.html";
            }
        } else {
            target = "/index.html";
        }
        String query = request.getQueryString();
        if (query != null && !query.isBlank() && !target.contains("#")) {
            target += "?" + query;
        }
        return redirect(target);
    }

    private static ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(HttpStatus.FOUND).header("Location", location).build();
    }
}
