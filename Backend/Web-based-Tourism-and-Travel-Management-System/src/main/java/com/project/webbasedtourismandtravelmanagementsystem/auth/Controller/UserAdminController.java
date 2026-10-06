package com.project.webbasedtourismandtravelmanagementsystem.auth.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.security.CurrentUser;
import com.project.webbasedtourismandtravelmanagementsystem.auth.service.UserService;
import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** User & Role Management (System Administrator only). */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize(Access.ADMIN)
public class UserAdminController {

    private final UserService userService;
    private final CurrentUser currentUser;

    public UserAdminController(UserService userService, CurrentUser currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<UserResponse> list(@RequestParam(required = false) Role role, @RequestParam(required = false) String q) {
        return userService.listUsers(role, q);
    }

    @GetMapping("/roles")
    public List<RoleOption> roles() {
        return userService.roles();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody StaffUserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return userService.updateUser(id, request, currentUser.id());
    }

    @DeleteMapping("/{id}")
    public MessageResponse delete(@PathVariable Long id) {
        userService.deleteUser(id, currentUser.id());
        return MessageResponse.of("User deleted");
    }
}
