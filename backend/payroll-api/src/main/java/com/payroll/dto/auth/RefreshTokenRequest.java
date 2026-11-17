package com.payroll.dto.auth;
import lombok.Data;

@Data
public class RefreshTokenRequest {
    private String refreshToken;
}
