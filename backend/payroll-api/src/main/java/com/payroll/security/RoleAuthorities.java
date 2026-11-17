package com.payroll.security;

import com.payroll.enums.SystemRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.List;

final class RoleAuthorities {

    private RoleAuthorities() {}

    static List<GrantedAuthority> forRole(SystemRole role) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        if (role == SystemRole.SUPER_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return List.copyOf(authorities);
    }
}
