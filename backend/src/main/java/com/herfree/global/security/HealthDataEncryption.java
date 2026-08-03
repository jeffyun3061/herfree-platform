package com.herfree.global.security;

import java.util.Base64;
import java.util.HexFormat;

/** Key decoding and validation shared by the runtime guard and JPA converter. */
public final class HealthDataEncryption {

    private static final int KEY_BYTES = 32;

    private HealthDataEncryption() {
    }

    public static byte[] decodeKey(String material) {
        if (material == null || material.isBlank()) {
            throw new IllegalArgumentException("health data encryption key is empty");
        }

        String normalized = material.trim();
        try {
            byte[] decoded = normalized.matches("[0-9a-fA-F]{64}")
                    ? HexFormat.of().parseHex(normalized)
                    : Base64.getDecoder().decode(normalized);
            if (decoded.length != KEY_BYTES) {
                throw new IllegalArgumentException("health data encryption key must decode to 32 bytes");
            }
            return decoded;
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("health data encryption key must be 32-byte base64 or 64-char hex", ex);
        }
    }
}
