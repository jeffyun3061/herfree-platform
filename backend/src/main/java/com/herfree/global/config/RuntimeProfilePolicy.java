package com.herfree.global.config;

import java.util.Arrays;
import java.util.Set;
import org.springframework.core.env.Environment;

public final class RuntimeProfilePolicy {

    private static final Set<String> ALLOWED_PROFILES = Set.of("local", "test", "staging", "prod");
    private static final Set<String> PUBLIC_PROFILES = Set.of("staging", "prod");

    private RuntimeProfilePolicy() {
    }

    public static void requireExplicitSingleProfile(Environment environment) {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length != 1 || !ALLOWED_PROFILES.contains(activeProfiles[0])) {
            throw new IllegalStateException(
                    "Exactly one Spring profile must be active: local, test, staging, or prod. active="
                            + Arrays.toString(activeProfiles));
        }
    }

    public static boolean isPublicEnvironment(Environment environment) {
        return Arrays.stream(environment.getActiveProfiles()).anyMatch(PUBLIC_PROFILES::contains);
    }
}
