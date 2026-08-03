package com.herfree.domain.journal.entity;

import com.herfree.global.security.HealthDataEncryption;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Encrypts new journal memo values with AES-GCM. Rows written before the key
 * was enabled remain readable as legacy plaintext until the re-key operation.
 */
@Converter
public class HealthDataStringAttributeConverter implements AttributeConverter<String, String> {

    private static final String PREFIX = "v1:";
    private static final String KEY_ENV = "HEALTH_DATA_ENCRYPTION_KEY";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final byte[] key;

    public HealthDataStringAttributeConverter() {
        this(System.getenv(KEY_ENV));
    }

    public HealthDataStringAttributeConverter(String keyMaterial) {
        this.key = keyMaterial == null || keyMaterial.isBlank()
                ? null
                : HealthDataEncryption.decodeKey(keyMaterial);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        // Local/test profiles may intentionally omit the key; public profiles
        // are fail-closed by RuntimeProfilePolicy before any data is served.
        if (key == null) {
            return attribute;
        }

        try {
            byte[] iv = new byte[IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            return PREFIX + Base64.getEncoder().encodeToString(
                    ByteBuffer.allocate(iv.length + ciphertext.length).put(iv).put(ciphertext).array());
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("failed to encrypt health data", ex);
        }
    }

    @Override
    public String convertToEntityAttribute(String stored) {
        if (stored == null || stored.isEmpty() || !stored.startsWith(PREFIX)) {
            return stored;
        }
        if (key == null) {
            throw new IllegalStateException("encrypted health data cannot be read without HEALTH_DATA_ENCRYPTION_KEY");
        }

        try {
            byte[] payload = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            if (payload.length <= IV_BYTES) {
                throw new IllegalArgumentException("encrypted health data payload is truncated");
            }
            byte[] iv = new byte[IV_BYTES];
            byte[] ciphertext = new byte[payload.length - IV_BYTES];
            System.arraycopy(payload, 0, iv, 0, IV_BYTES);
            System.arraycopy(payload, IV_BYTES, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw new IllegalStateException("failed to decrypt health data", ex);
        }
    }
}
