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

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        User admin = userRepository.findByEmail("admin@payroll.com").orElse(null);

        if (admin == null) {
            admin = User.builder()
                    .email("admin@payroll.com")
                    .systemRole(SystemRole.ADMIN)
                    .enabled(true)
                    .mustChangePassword(false)
                    .build();
        }

        admin.setPasswordHash("admin123");

        userRepository.save(admin);

        System.out.println("✅ ADMIN ACCOUNT RESET TO PLAIN TEXT: admin@payroll.com / admin123");
    }
}
