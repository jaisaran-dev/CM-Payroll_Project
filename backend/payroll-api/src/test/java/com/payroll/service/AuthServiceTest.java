package com.payroll.service;

import com.payroll.dto.auth.LoginRequest;
import com.payroll.entity.User;
import com.payroll.enums.SystemRole;
import com.payroll.repository.LoginActivityRepository;
import com.payroll.repository.UserRepository;
import com.payroll.security.JwtService;
import com.payroll.security.MigratingPasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void upgradesLegacyPasswordAfterSuccessfulLogin() {
        UserRepository userRepository = mock(UserRepository.class);
        MigratingPasswordEncoder passwordEncoder = new MigratingPasswordEncoder();
        JwtService jwtService = mock(JwtService.class);
        RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
        LoginActivityRepository loginActivityRepository = mock(LoginActivityRepository.class);
        AuthService service = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                refreshTokenService,
                loginActivityRepository);
        User user = User.builder()
                .email("employee@example.com")
                .passwordHash("legacy-secret")
                .systemRole(SystemRole.EMPLOYEE)
                .enabled(true)
                .build();
        LoginRequest request = new LoginRequest();
        request.setEmail(user.getEmail());
        request.setPassword("legacy-secret");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user.getEmail(), SystemRole.EMPLOYEE.name()))
                .thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(user)).thenReturn("refresh-token");

        service.login(request, mock(HttpServletRequest.class));

        assertNotEquals("legacy-secret", user.getPasswordHash());
        assertTrue(passwordEncoder.matches("legacy-secret", user.getPasswordHash()));
        verify(userRepository).save(user);
    }
}
