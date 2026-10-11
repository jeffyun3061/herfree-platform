package com.herfree.domain.auth.mfa;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** RFC 6238 TOTP and per-user authenticated encryption. No secrets are logged. */
@Component
public class MfaCrypto {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private final byte[] key;

    public MfaCrypto(@Value("${app.admin.mfa.encryption-key:}") String encodedKey) {
        key = encodedKey.isBlank() ? null : decodeKey(encodedKey);
    }

    public static byte[] decodeKey(String encodedKey) {
        byte[] decoded = Base64.getDecoder().decode(encodedKey);
        if (decoded.length != 32) throw new IllegalArgumentException("MFA key must contain 32 bytes");
        return decoded;
    }

    public String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String newSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        StringBuilder result = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : bytes) {
            buffer = (buffer << 8) | (b & 255);
            bits += 8;
            while (bits >= 5) {
                bits -= 5;
                result.append(ALPHABET.charAt((buffer >> bits) & 31));
            }
        }
        return result.toString();
    }

    public static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    public String encrypt(long userId, String secret) {
        try {
            byte[] iv = new byte[12];
            RANDOM.nextBytes(iv);
            Cipher cipher = cipher(Cipher.ENCRYPT_MODE, userId, iv);
            byte[] encrypted = cipher.doFinal(secret.getBytes(StandardCharsets.US_ASCII));
            return "v1:" + Base64.getEncoder().encodeToString(ByteBuffer
                    .allocate(iv.length + encrypted.length).put(iv).put(encrypted).array());
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("MFA encryption failed", ex);
        }
    }

    public String decrypt(long userId, String encrypted) {
        try {
            if (!encrypted.startsWith("v1:")) throw new IllegalArgumentException("Invalid MFA ciphertext");
            byte[] bytes = Base64.getDecoder().decode(encrypted.substring(3));
            if (bytes.length <= 28) throw new IllegalArgumentException("Invalid MFA ciphertext");
            byte[] iv = java.util.Arrays.copyOfRange(bytes, 0, 12);
            return new String(cipher(Cipher.DECRYPT_MODE, userId, iv)
                    .doFinal(bytes, 12, bytes.length - 12), StandardCharsets.US_ASCII);
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("MFA decryption failed", ex);
        }
    }

    private Cipher cipher(int mode, long userId, byte[] iv) throws java.security.GeneralSecurityException {
        if (key == null) throw new IllegalStateException("ADMIN_MFA_ENCRYPTION_KEY is required");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(mode, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        cipher.updateAAD(("herfree-admin-mfa:" + userId).getBytes(StandardCharsets.US_ASCII));
        return cipher;
    }

    public long matchingStep(String secret, String supplied, long epochSeconds, long lastUsedStep) {
        if (supplied == null || !supplied.matches("[0-9]{6}")) return -1;
        long current = epochSeconds / 30;
        long matched = -1;
        for (long step = current - 1; step <= current + 1; step++) {
            boolean equal = MessageDigest.isEqual(code(secret, step, 6).getBytes(StandardCharsets.US_ASCII),
                    supplied.getBytes(StandardCharsets.US_ASCII));
            if (equal && step > lastUsedStep) matched = step;
        }
        return matched;
    }

    static String code(String secret, long step, int digits) {
        try {
            java.io.ByteArrayOutputStream decoded = new java.io.ByteArrayOutputStream();
            int buffer = 0, bits = 0;
            for (char ch : secret.toCharArray()) {
                int value = ALPHABET.indexOf(ch);
                if (value < 0) throw new IllegalArgumentException("Invalid Base32 secret");
                buffer = (buffer << 5) | value;
                bits += 5;
                if (bits >= 8) { bits -= 8; decoded.write((buffer >> bits) & 255); }
            }
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(decoded.toByteArray(), "HmacSHA1"));
            byte[] digest = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int offset = digest[digest.length - 1] & 15;
            int binary = ByteBuffer.wrap(digest, offset, 4).getInt() & 0x7fffffff;
            int modulus = digits == 8 ? 100_000_000 : 1_000_000;
            return String.format(java.util.Locale.ROOT, "%0" + digits + "d", binary % modulus);
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("TOTP verification unavailable", ex);
        }
    }
}
