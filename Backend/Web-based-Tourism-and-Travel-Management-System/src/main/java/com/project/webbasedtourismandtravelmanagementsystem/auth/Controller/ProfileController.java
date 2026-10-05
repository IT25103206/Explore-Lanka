package com.project.webbasedtourismandtravelmanagementsystem.auth.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.ChangePasswordRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.ProfileResponse;
import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.ProfileUpdateRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.auth.service.UserService;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/** Customer Profile Management - also used by staff and partners for their own account. */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;
    private final CurrentUser currentUser;

    public ProfileController(UserService userService, CurrentUser currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public ProfileResponse get() {
        return userService.profile(currentUser.id());
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody ProfileUpdateRequest request) {
        return userService.updateProfile(currentUser.id(), request);
    }

    @PutMapping("/password")
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.id(), request);
        return MessageResponse.of("Password changed successfully");
    }
}
