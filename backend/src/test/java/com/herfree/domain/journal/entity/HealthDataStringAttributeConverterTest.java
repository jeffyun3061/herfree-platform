package com.herfree.domain.journal.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;
import org.junit.jupiter.api.Test;

class HealthDataStringAttributeConverterTest {

    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    @Test
    void encryptsAndDecryptsMemoWithRandomizedPayload() {
        HealthDataStringAttributeConverter converter = new HealthDataStringAttributeConverter(KEY);

        String first = converter.convertToDatabaseColumn("민감한 건강 메모");
        String second = converter.convertToDatabaseColumn("민감한 건강 메모");

        assertThat(first).startsWith("v1:").isNotEqualTo(second);
        assertThat(converter.convertToEntityAttribute(first)).isEqualTo("민감한 건강 메모");
        assertThat(converter.convertToEntityAttribute(second)).isEqualTo("민감한 건강 메모");
    }

    @Test
    void keepsLegacyPlaintextReadableDuringRekeyWindow() {
        HealthDataStringAttributeConverter converter = new HealthDataStringAttributeConverter(KEY);

        assertThat(converter.convertToEntityAttribute("legacy memo")).isEqualTo("legacy memo");
    }

    @Test
    void rejectsMalformedKeyMaterial() {
        assertThatThrownBy(() -> new HealthDataStringAttributeConverter("not-a-key"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("health data encryption key");
    }
}
