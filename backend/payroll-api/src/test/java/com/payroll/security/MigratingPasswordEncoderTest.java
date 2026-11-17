package com.payroll.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MigratingPasswordEncoderTest {

    private final MigratingPasswordEncoder encoder = new MigratingPasswordEncoder();

    @Test
    void encodesPasswordsWithBcryptAndVerifiesThem() {
        String encoded = encoder.encode("secret");

        assertTrue(encoded.startsWith("{bcrypt}$2"));
        assertTrue(encoder.matches("secret", encoded));
        assertFalse(encoder.matches("wrong", encoded));
        assertFalse(encoder.upgradeEncoding(encoded));
    }

    @Test
    void acceptsLegacyPlaintextOnlyForMigration() {
        assertTrue(encoder.matches("legacy-secret", "legacy-secret"));
        assertTrue(encoder.upgradeEncoding("legacy-secret"));
        assertFalse(encoder.matches("wrong", "legacy-secret"));
    }
}
