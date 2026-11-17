package com.payroll.config;

import com.payroll.entity.User;
import com.payroll.enums.SystemRole;
import com.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String SUPER_ADMIN_EMAIL = "superadmin@payroll.com";

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        User superAdmin = userRepository.findByEmail(SUPER_ADMIN_EMAIL).orElse(null);
        if (superAdmin == null) {
            if (userRepository.count() == 0) {
                System.out.println("No users found. Insert the super admin using the SQL script.");
            }
            return;
        }

        if (superAdmin.getSystemRole() != SystemRole.SUPER_ADMIN) {
            superAdmin.setSystemRole(SystemRole.SUPER_ADMIN);
            userRepository.save(superAdmin);
        }
    }
}
