package com.project.webbasedtourismandtravelmanagementsystem.auth.controller;

import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.LoginRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.RegisterRequest;
import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.UserResponse;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.security.AppUserDetails;
import com.project.webbasedtourismandtravelmanagementsystem.auth.service.UserService;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

/** Register, log in and "who am I". Logout is handled by Spring Security at POST /api/auth/logout. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(body.email().trim(), body.password()));
        AppUserDetails principal = (AppUserDetails) auth.getPrincipal();

        if ("staff".equals(body.portal()) && principal.getRole() == Role.CUSTOMER) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customers sign in from the customer login page");
        }

        // protect against session fixation, then store the authenticated context in the session
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        userService.recordLogin(principal.getId());
        return userService.me(principal.getId());
    }

    /** Returns the logged-in user, or an empty body when nobody is logged in. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        return principal == null ? null : userService.me(principal.getId());
    }
}
