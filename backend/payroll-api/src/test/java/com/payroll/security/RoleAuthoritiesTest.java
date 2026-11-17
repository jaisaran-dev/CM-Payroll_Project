package com.payroll.security;

import com.payroll.enums.SystemRole;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleAuthoritiesTest {

    @Test
    void superAdminHasAdminAndSuperAdminAuthorities() {
        var authorities = RoleAuthorities.forRole(SystemRole.SUPER_ADMIN);

        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        assertTrue(authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }
}
