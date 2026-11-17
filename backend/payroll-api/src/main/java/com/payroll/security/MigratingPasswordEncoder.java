package com.payroll.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class MigratingPasswordEncoder implements PasswordEncoder {

    private static final String BCRYPT_PREFIX = "{bcrypt}";
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return BCRYPT_PREFIX + bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (encodedPassword == null) {
            return false;
        }

        if (encodedPassword.startsWith(BCRYPT_PREFIX)) {
            return bcrypt.matches(rawPassword, encodedPassword.substring(BCRYPT_PREFIX.length()));
        }

        return MessageDigest.isEqual(
                rawPassword.toString().getBytes(StandardCharsets.UTF_8),
                encodedPassword.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public boolean upgradeEncoding(String encodedPassword) {
        if (encodedPassword == null || !encodedPassword.startsWith(BCRYPT_PREFIX)) {
            return true;
        }

        return bcrypt.upgradeEncoding(encodedPassword.substring(BCRYPT_PREFIX.length()));
    }
}
