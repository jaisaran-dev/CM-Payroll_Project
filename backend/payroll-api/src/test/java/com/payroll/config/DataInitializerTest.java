package com.payroll.config;

import com.payroll.entity.User;
import com.payroll.enums.SystemRole;
import com.payroll.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DataInitializerTest {

    @Test
    void storesSuperAdminRoleForConfiguredSuperAdminAccount() {
        UserRepository userRepository = mock(UserRepository.class);
        User superAdmin = User.builder()
                .email("superadmin@payroll.com")
                .systemRole(SystemRole.ADMIN)
                .build();
        when(userRepository.findByEmail("superadmin@payroll.com"))
                .thenReturn(Optional.of(superAdmin));

        new DataInitializer(userRepository).run();

        assertEquals(SystemRole.SUPER_ADMIN, superAdmin.getSystemRole());
        verify(userRepository).save(superAdmin);
    }
}
