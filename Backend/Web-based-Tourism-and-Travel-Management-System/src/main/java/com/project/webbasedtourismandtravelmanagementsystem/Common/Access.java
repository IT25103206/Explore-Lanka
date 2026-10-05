package com.project.webbasedtourismandtravelmanagementsystem.common;

/**
 * Role checks used in {@code @PreAuthorize}. Keeping them in one place makes the
 * access-control matrix easy to review.
 *
 *  Tour Operations Manager          - tour packages only
 *  Logistic Supplier Management     - resource allocation, hotels and vehicles
 *  Business Manager                 - tour guides, transport providers & all partners, rates & contracts (UC-02),
 *                                     feedback and reports
 *  Finance & Booking Coordinator    - bookings, payments & refunds, reports, feedback
 *  Marketing Executive - Promotions - promotions & offers only
 *  Marketing Executive - Events     - events & festivals only (the "Event Organizer" actor)
 *  System Administrator             - everything, plus users and approval of rate changes above 20%
 */
public final class Access {

    private Access() {
    }

    public static final String CUSTOMER = "hasRole('CUSTOMER')";
    public static final String ADMIN = "hasRole('SYSTEM_ADMIN')";
    /** Any management-portal user (dashboard, read-only package list used for linking). */
    public static final String STAFF = "hasAnyRole('TOUR_OPERATIONS_MANAGER','LOGISTIC_SUPPLIER_MANAGER','BUSINESS_MANAGER','FINANCE_COORDINATOR','MARKETING_EXECUTIVE','EVENT_ORGANIZER','SYSTEM_ADMIN')";
    public static final String PACKAGES = "hasAnyRole('TOUR_OPERATIONS_MANAGER','SYSTEM_ADMIN')";
    public static final String OPERATIONS = "hasAnyRole('LOGISTIC_SUPPLIER_MANAGER','SYSTEM_ADMIN')";
    /** Supplier records (incl. transport provider companies), contracts and service rates (UC-02). */
    public static final String PARTNERS = "hasAnyRole('BUSINESS_MANAGER','SYSTEM_ADMIN')";
    /** Tour guide records. */
    public static final String GUIDES = "hasAnyRole('BUSINESS_MANAGER','SYSTEM_ADMIN')";
    /** Unavailable days: guides belong to the Business Manager, vehicles to Logistic Supplier Management. */
    public static final String BLOCKED_DATES = "(#type.name() == 'GUIDE' and hasAnyRole('BUSINESS_MANAGER','SYSTEM_ADMIN'))"
            + " or (#type.name() != 'GUIDE' and hasAnyRole('LOGISTIC_SUPPLIER_MANAGER','SYSTEM_ADMIN'))";
    public static final String BOOKINGS = "hasAnyRole('FINANCE_COORDINATOR','SYSTEM_ADMIN')";
    public static final String FINANCE = "hasAnyRole('FINANCE_COORDINATOR','SYSTEM_ADMIN')";
    public static final String MARKETING = "hasAnyRole('MARKETING_EXECUTIVE','SYSTEM_ADMIN')";
    public static final String EVENTS = "hasAnyRole('EVENT_ORGANIZER','SYSTEM_ADMIN')";
    public static final String REPORTS = "hasAnyRole('BUSINESS_MANAGER','FINANCE_COORDINATOR','SYSTEM_ADMIN')";
    public static final String FEEDBACK = "hasAnyRole('BUSINESS_MANAGER','FINANCE_COORDINATOR','SYSTEM_ADMIN')";
    public static final String PARTNER = "hasAnyRole('HOTEL_PARTNER','TRANSPORT_PROVIDER','TOUR_GUIDE')";
}
