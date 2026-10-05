package com.project.webbasedtourismandtravelmanagementsystem.auth.model;

import com.project.webbasedtourismandtravelmanagementsystem.common.BaseEntity;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    /** BCrypt hash - the plain password is never stored. */
    @Column(nullable = false, length = 100)
    private String password;

    @Column(length = 20)
    private String phone;

    /** Stored as text (not a MySQL ENUM) so roles can be added or renamed without a manual ALTER TABLE. */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /** For hotel partners and transport providers: the supplier company they log in for. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    public User(String fullName, String email, String password, String phone, Role role) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
    }
}
