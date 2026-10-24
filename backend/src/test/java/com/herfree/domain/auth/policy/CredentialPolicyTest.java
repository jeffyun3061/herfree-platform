package com.herfree.domain.auth.policy;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CredentialPolicyTest {

    @Test
    void acceptsAValidEmailWithinTheMaximumLength() {
        assertThat(CredentialPolicy.isValidEmailFormat("member@example.com")).isTrue();
    }

    @Test
    void rejectsAnEmailWithoutAValidDomainPart() {
        assertThat(CredentialPolicy.isValidEmailFormat("member@example")).isFalse();
        assertThat(CredentialPolicy.isValidEmailFormat("member@example.")).isFalse();
        assertThat(CredentialPolicy.isValidEmailFormat("member@@example.com")).isFalse();
    }

    @Test
    void rejectsAnEmailThatExceedsTheConfiguredMaximumLengthBeforePatternMatching() {
        String overlongEmail = "a".repeat(CredentialPolicy.EMAIL_MAX_LENGTH) + "@example.com";

        assertThat(CredentialPolicy.isValidEmailFormat(overlongEmail)).isFalse();
    }
}
