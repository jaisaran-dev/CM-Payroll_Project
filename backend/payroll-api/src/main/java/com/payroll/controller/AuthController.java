package com.payroll.controller;

import com.payroll.dto.auth.*;
import com.payroll.dto.common.ApiResponse;
import com.payroll.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        LoginResponse loginData = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .success(true).message("Login successfully.").data(loginData).build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(@RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.<RefreshTokenResponse>builder()
                .success(true).message("Token refreshed successfully.").data(response).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        if (request != null) {
            authService.logout(request.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true).message("Logged out successfully.").build());
    }
}
