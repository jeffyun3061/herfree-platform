package com.herfree.global.config;

import com.herfree.global.security.HealthDataEncryption;
import com.herfree.global.util.ClientIpExtractor;
import java.util.Arrays;
import java.util.Set;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

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

    /** Refuses to boot a public profile with local defaults or without required transport/storage settings. */
    public static void requirePublicDeploymentSettings(Environment environment) {
        if (!isPublicEnvironment(environment)) {
            return;
        }

        String jwtSecret = environment.getProperty("jwt.secret", "");
        if (jwtSecret.length() < 32 || jwtSecret.toLowerCase().contains("change_me")) {
            throw new IllegalStateException("Public profile requires a strong JWT_SECRET");
        }
        String analyticsSalt = environment.getProperty("app.analytics.hash-salt", "");
        if (analyticsSalt.length() < 32
                || analyticsSalt.toLowerCase().contains("change_me")
                || analyticsSalt.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "Public profile requires a strong ANALYTICS_HASH_SALT distinct from JWT_SECRET");
        }
        if (!"smtp".equalsIgnoreCase(environment.getProperty("app.mail.mode", ""))) {
            throw new IllegalStateException("Public profile requires APP_MAIL_MODE=smtp");
        }
        if (environment.getProperty("app.bootstrap.enabled", Boolean.class, false)) {
            throw new IllegalStateException("ADMIN_BOOTSTRAP_ENABLED must be false in a public profile");
        }

        String corsOrigin = environment.getProperty("app.cors.allowed-origins", "");
        if (!StringUtils.hasText(corsOrigin) || !corsOrigin.trim().startsWith("https://")) {
            throw new IllegalStateException("Public profile requires an HTTPS CORS origin");
        }

        requirePublicDatasourceTls(environment);
        if (!StringUtils.hasText(environment.getProperty("app.s3.bucket", ""))) {
            throw new IllegalStateException("Public profile requires an S3 bucket");
        }
        if (StringUtils.hasText(environment.getProperty("app.s3.access-key", ""))
                || StringUtils.hasText(environment.getProperty("app.s3.secret-key", ""))) {
            throw new IllegalStateException("Public profile must use the EC2 IAM role instead of static S3 keys");
        }
        String adminAccessCidrs = environment.getProperty("app.admin.access-allowed-cidrs", "");
        if (!ClientIpExtractor.isRestrictedCidrList(adminAccessCidrs)) {
            throw new IllegalStateException("Public profile requires a restricted ADMIN_ACCESS_ALLOWED_CIDRS gate");
        }
        String healthDataKey = environment.getProperty("app.health-data.encryption-key", "");
        try {
            HealthDataEncryption.decodeKey(healthDataKey);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Public profile requires a valid HEALTH_DATA_ENCRYPTION_KEY", ex);
        }
        if (Arrays.asList(environment.getActiveProfiles()).contains("prod")
                && environment.getProperty("app.health-data.rekey-on-startup", Boolean.class, false)) {
            throw new IllegalStateException("HEALTH_DATA_REKEY_ON_STARTUP is allowed only in staging");
        }
    }

    private static void requirePublicDatasourceTls(Environment environment) {
        String databaseRuntime = environment.getProperty("DB_RUNTIME", "rds").trim().toLowerCase();
        String datasourceUrl = environment.getProperty("spring.datasource.url", "");
        if ("rds".equals(databaseRuntime)) {
            if (!hasQueryParameter(datasourceUrl, "sslMode", "VERIFY_IDENTITY")
                    || !hasQueryParameter(
                            datasourceUrl,
                            "trustCertificateKeyStoreUrl",
                            "file:/app/certs/rds-truststore.p12")
                    || !hasQueryParameter(datasourceUrl, "fallbackToSystemTrustStore", "false")) {
                throw new IllegalStateException("Public RDS runtime requires certificate-verified TLS");
            }
            return;
        }
        if ("local".equals(databaseRuntime)) {
            if (!datasourceUrl.startsWith("jdbc:mysql://mysql:3306/")
                    || !hasQueryParameter(datasourceUrl, "sslMode", "REQUIRED")) {
                throw new IllegalStateException(
                        "Public local DB runtime requires the private mysql service with required TLS");
            }
            return;
        }
        throw new IllegalStateException("Public profile requires DB_RUNTIME=rds or DB_RUNTIME=local");
    }

    private static boolean hasQueryParameter(String url, String key, String value) {
        int queryStart = url.indexOf('?');
        if (queryStart < 0 || queryStart == url.length() - 1) {
            return false;
        }
        String expected = key + "=" + value;
        return Arrays.stream(url.substring(queryStart + 1).split("&"))
                .anyMatch(expected::equals);
    }
}
