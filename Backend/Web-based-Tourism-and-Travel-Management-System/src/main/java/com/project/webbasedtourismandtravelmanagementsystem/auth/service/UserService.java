package com.project.webbasedtourismandtravelmanagementsystem.auth.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.dto.AuthDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Customer;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.CustomerRepository;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.TourGuideRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/** Registration, profiles and User & Role Management. */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final BookingRepository bookingRepository;
    private final TourGuideRepository tourGuideRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserService(UserRepository userRepository, CustomerRepository customerRepository,
                       SupplierRepository supplierRepository, BookingRepository bookingRepository,
                       TourGuideRepository tourGuideRepository, PasswordEncoder passwordEncoder,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.bookingRepository = bookingRepository;
        this.tourGuideRepository = tourGuideRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    // ------------------------------------------------------------------ registration / login

    public UserResponse register(RegisterRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw new BusinessException("Passwords do not match");
        }
        String email = normaliseEmail(req.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw BusinessException.conflict("An account with this email already exists. Try logging in.");
        }
        User user = userRepository.save(new User(req.fullName().trim(), email,
                passwordEncoder.encode(req.password()), blankToNull(req.phone()), Role.CUSTOMER));
        Customer customer = new Customer(user);
        customer.setCountry(blankToNull(req.country()));
        customer.setMarketingConsent(req.marketingConsent());
        customerRepository.save(customer);
        notificationService.notify(user, Notification.Type.SYSTEM, "Welcome to Explore Lanka",
                "Your account is ready. Browse our tour packages and start planning your trip.", "/packages.html");
        return UserResponse.from(user);
    }

    public void recordLogin(Long userId) {
        userRepository.findById(userId).ifPresent(u -> u.setLastLoginAt(LocalDateTime.now()));
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return UserResponse.from(find(userId));
    }

    // ------------------------------------------------------------------ profile

    @Transactional(readOnly = true)
    public ProfileResponse profile(Long userId) {
        User user = find(userId);
        return ProfileResponse.from(user, customerRepository.findByUserId(userId).orElse(null));
    }

    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest req) {
        User user = find(userId);
        user.setFullName(req.fullName().trim());
        user.setPhone(blankToNull(req.phone()));
        Customer customer = null;
        if (user.getRole() == Role.CUSTOMER) {
            customer = customerRepository.findByUserId(userId).orElseGet(() -> customerRepository.save(new Customer(user)));
            customer.setCountry(blankToNull(req.country()));
            customer.setNationality(blankToNull(req.nationality()));
            customer.setAddress(blankToNull(req.address()));
            customer.setDateOfBirth(req.dateOfBirth());
            customer.setTravelPreferences(blankToNull(req.travelPreferences()));
            customer.setMarketingConsent(req.marketingConsent());
        }
        return ProfileResponse.from(user, customer);
    }

    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = find(userId);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new BusinessException("Your current password is incorrect");
        }
        if (!req.newPassword().equals(req.confirmPassword())) {
            throw new BusinessException("New passwords do not match");
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPassword())) {
            throw new BusinessException("Choose a password you have not used before");
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
    }

    // ------------------------------------------------------------------ admin user management

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers(Role role, String q) {
        String term = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> term.isEmpty() || u.getFullName().toLowerCase(Locale.ROOT).contains(term)
                        || u.getEmail().toLowerCase(Locale.ROOT).contains(term))
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse createUser(StaffUserRequest req) {
        String email = normaliseEmail(req.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw BusinessException.conflict("An account with this email already exists");
        }
        User user = new User(req.fullName().trim(), email, passwordEncoder.encode(req.password()),
                blankToNull(req.phone()), req.role());
        user.setSupplier(resolveSupplier(req.role(), req.supplierId()));
        userRepository.save(user);
        if (req.role() == Role.CUSTOMER) {
            customerRepository.save(new Customer(user));
        }
        return UserResponse.from(user);
    }

    public UserResponse updateUser(Long id, UserUpdateRequest req, Long actingAdminId) {
        User user = find(id);
        if (id.equals(actingAdminId) && (!req.active() || req.role() != user.getRole())) {
            throw new BusinessException("You cannot deactivate your own account or change your own role");
        }
        user.setFullName(req.fullName().trim());
        user.setPhone(blankToNull(req.phone()));
        user.setRole(req.role());
        user.setActive(req.active());
        user.setSupplier(resolveSupplier(req.role(), req.supplierId()));
        if (req.role() == Role.CUSTOMER && customerRepository.findByUserId(id).isEmpty()) {
            customerRepository.save(new Customer(user));
        }
        return UserResponse.from(user);
    }

    public void deleteUser(Long id, Long actingAdminId) {
        if (id.equals(actingAdminId)) {
            throw new BusinessException("You cannot delete your own account");
        }
        User user = find(id);
        if (bookingRepository.existsByCustomerId(id)) {
            throw BusinessException.conflict("This customer has booking history. Deactivate the account instead so records stay intact.");
        }
        tourGuideRepository.findByUserId(id).ifPresent(g -> g.setUser(null));
        customerRepository.findByUserId(id).ifPresent(customerRepository::delete);
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<RoleOption> roles() {
        return Arrays.stream(Role.values())
                .map(r -> new RoleOption(r, r.getDisplayName(), r.isStaff(), r.isPartner()))
                .toList();
    }

    // ------------------------------------------------------------------ helpers

    private Supplier resolveSupplier(Role role, Long supplierId) {
        if (role != Role.HOTEL_PARTNER && role != Role.TRANSPORT_PROVIDER) {
            return null;
        }
        if (supplierId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Hotel partners and transport providers must be linked to a supplier");
        }
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException("Supplier", supplierId));
        Supplier.Type expected = role == Role.HOTEL_PARTNER ? Supplier.Type.HOTEL : Supplier.Type.TRANSPORT;
        if (supplier.getType() != expected) {
            throw new BusinessException("Choose a " + expected.name().toLowerCase(Locale.ROOT) + " supplier for this role");
        }
        return supplier;
    }

    private User find(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException("User", id));
    }

    private static String normaliseEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
