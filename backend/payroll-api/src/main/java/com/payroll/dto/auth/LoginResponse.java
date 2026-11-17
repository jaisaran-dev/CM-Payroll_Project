package com.payroll.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token; // Access Token
    private String refreshToken; // Refresh Token
    private String role;
    private Long employeeId;
    private String name;
}
