package com.project.webbasedtourismandtravelmanagementsystem.auth.model;

import lombok.Getter;

/** User roles from the stakeholder analysis (the Marketing Executive is split into Promotions and Events logins). */
@Getter
public enum Role {
    CUSTOMER("Tourist / Customer", false, false),
    TOUR_OPERATIONS_MANAGER("Tour Operations Manager", true, false),
    LOGISTIC_SUPPLIER_MANAGER("Logistic Supplier Management", true, false),
    BUSINESS_MANAGER("Business Manager", true, false),
    FINANCE_COORDINATOR("Finance & Booking Coordinator", true, false),
    MARKETING_EXECUTIVE("Marketing Executive - Promotions", true, false),
    EVENT_ORGANIZER("Marketing Executive - Events", true, false),
    SYSTEM_ADMIN("System Administrator", true, false),
    HOTEL_PARTNER("Hotel Partner", false, true),
    TRANSPORT_PROVIDER("Transport Provider", false, true),
    TOUR_GUIDE("Tour Guide", false, true);

    private final String displayName;
    private final boolean staff;
    private final boolean partner;

    Role(String displayName, boolean staff, boolean partner) {
        this.displayName = displayName;
        this.staff = staff;
        this.partner = partner;
    }
}
