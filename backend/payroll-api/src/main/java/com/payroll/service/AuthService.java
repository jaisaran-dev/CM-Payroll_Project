package com.payroll.service;

import com.payroll.dto.auth.*;
import com.payroll.entity.LoginActivity;
import com.payroll.entity.User;
import com.payroll.repository.LoginActivityRepository;
import com.payroll.repository.UserRepository;
import com.payroll.security.JwtService;
import com.payroll.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final LoginActivityRepository loginActivityRepository;

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with this email"));

        if (user.getEnabled() == null || !user.getEnabled()) {
            throw new DisabledException("Your account has been deactivated. Please contact the administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            saveLoginActivity(user, httpRequest, "FAILED");
            throw new BadCredentialsException("Invalid email or password");
        }

        if (passwordEncoder.upgradeEncoding(user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        saveLoginActivity(user, httpRequest, "SUCCESS");

        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getSystemRole().name());
        String refreshToken = refreshTokenService.createRefreshToken(user);

        return LoginResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .role(user.getSystemRole().name())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .name(user.getEmployee() != null ? user.getEmployee().getName() : null)
                .build();
    }

    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(token -> {
                    User user = token.getUser();

                    // Token Rotation
                    refreshTokenService.revokeToken(token);
                    String newRefreshToken = refreshTokenService.createRefreshToken(user);
                    String newAccessToken = jwtService.generateAccessToken(user.getEmail(), user.getSystemRole().name());

                    return RefreshTokenResponse.builder()
                            .accessToken(newAccessToken)
                            .refreshToken(newRefreshToken)
                            .build();
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null) {
            refreshTokenService.findByToken(refreshToken).ifPresent(token -> {
                refreshTokenService.revokeToken(token);
                saveLoginActivity(token.getUser(), null, "LOGOUT");
            });
        }
    }

    private void saveLoginActivity(User user, HttpServletRequest request, String status) {
        String ip = request != null ? request.getRemoteAddr() : "UNKNOWN";
        String userAgent = request != null ? request.getHeader("User-Agent") : "UNKNOWN";

        LoginActivity activity = LoginActivity.builder()
                .user(user)
                .email(user.getEmail())
                .ipAddress(ip)
                .userAgent(userAgent)
                .status(status)
                .build();
        loginActivityRepository.save(activity);
    }
}
