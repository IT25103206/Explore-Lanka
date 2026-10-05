package com.project.webbasedtourismandtravelmanagementsystem.Common;

/** Regular expressions shared by request DTOs (kept in sync with static/js/app.js). */
public final class ValidationRules {

    private ValidationRules() {
    }

    public static final String NAME = "^[A-Za-z][A-Za-z .'-]{1,99}$";
    public static final String NAME_MSG = "Use letters, spaces, apostrophes, dots or hyphens only (2-100 characters)";

    /** Sri Lankan (0771234567) or international (+94771234567) numbers. */
    public static final String PHONE = "^(\\+?[0-9]{9,15})?$";
    public static final String PHONE_MSG = "Enter a valid phone number, e.g. 0771234567 or +94771234567";

    /** At least 8 characters with an upper-case letter, a lower-case letter and a digit. */
    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,64}$";
    public static final String PASSWORD_MSG = "Password needs 8+ characters with upper-case, lower-case and a number";

    public static final String CODE = "^[A-Z0-9-]{3,30}$";
    public static final String CODE_MSG = "Use 3-30 upper-case letters, digits or hyphens";
}
