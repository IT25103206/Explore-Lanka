package com.project.webbasedtourismandtravelmanagementsystem.auth.security;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Gives services access to the user making the current request. */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUserDetails details() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserDetails details)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Please log in to continue");
        }
        return details;
    }

    public Long id() {
        return details().getId();
    }

    public Role role() {
        return details().getRole();
    }

    public boolean isStaff() {
        return role().isStaff();
    }

    public User entity() {
        return userRepository.findById(id())
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Your session has expired. Please log in again."));
    }
}
