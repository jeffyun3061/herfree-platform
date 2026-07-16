package com.herfree.global.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class RuntimeProfilePolicyTest {

    @Test
    void rejectsMissingOrMultipleProfiles() {
        assertThatThrownBy(() -> RuntimeProfilePolicy.requireExplicitSingleProfile(new MockEnvironment()))
                .isInstanceOf(IllegalStateException.class);

        MockEnvironment multiple = new MockEnvironment().withProperty("spring.profiles.active", "local,prod");
        multiple.setActiveProfiles("local", "prod");
        assertThatThrownBy(() -> RuntimeProfilePolicy.requireExplicitSingleProfile(multiple))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void acceptsKnownSingleProfilesAndTreatsStagingAsPublic() {
        MockEnvironment local = new MockEnvironment();
        local.setActiveProfiles("local");
        RuntimeProfilePolicy.requireExplicitSingleProfile(local);
        assertThat(RuntimeProfilePolicy.isPublicEnvironment(local)).isFalse();

        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        RuntimeProfilePolicy.requireExplicitSingleProfile(staging);
        assertThat(RuntimeProfilePolicy.isPublicEnvironment(staging)).isTrue();
    }
}
