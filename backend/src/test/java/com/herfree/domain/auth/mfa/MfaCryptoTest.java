package com.herfree.domain.auth.mfa;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class MfaCryptoTest {
    private static final String SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    private final MfaCrypto crypto = new MfaCrypto("AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=");

    @Test void matchesRfc6238Sha1VectorsIncludingBeyond2038() {
        long[] times = {59, 1111111109, 1111111111, 1234567890, 2000000000, 20000000000L};
        String[] expected = {"94287082", "07081804", "14050471", "89005924", "69279037", "65353130"};
        for (int i=0; i<times.length; i++) assertThat(MfaCrypto.code(SECRET, times[i]/30, 8)).isEqualTo(expected[i]);
    }

    @Test void acceptsClockSkewButRejectsReplayedStepsAndMalformedCodes() {
        String code = MfaCrypto.code(SECRET, 10, 6);
        assertThat(crypto.matchingStep(SECRET, code, 330, -1)).isEqualTo(10);
        assertThat(crypto.matchingStep(SECRET, code, 330, 10)).isEqualTo(-1);
        assertThat(crypto.matchingStep(SECRET, code, 360, -1)).isEqualTo(-1);
        assertThat(crypto.matchingStep(SECRET, "0000000", 300, -1)).isEqualTo(-1);
    }

    @Test void encryptsSecretsWithUniqueIvsAndUserBinding() {
        String encrypted = crypto.encrypt(7, SECRET);
        assertThat(encrypted).doesNotContain(SECRET).isNotEqualTo(crypto.encrypt(7, SECRET));
        assertThat(crypto.decrypt(7, encrypted)).isEqualTo(SECRET);
        assertThatThrownBy(() -> crypto.decrypt(8, encrypted)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new MfaCrypto("").encrypt(7, SECRET)).isInstanceOf(IllegalStateException.class);
    }
}
