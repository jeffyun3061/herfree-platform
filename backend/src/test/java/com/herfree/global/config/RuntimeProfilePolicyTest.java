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

    @Test
    void rejectsPublicProfileWithLocalJwtDefaultOrMissingTls() {
        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        staging.withProperty("jwt.secret", "change_me_jwt_secret_that_is_long_enough_123456")
                .withProperty("app.mail.mode", "smtp")
                .withProperty("app.bootstrap.enabled", "false")
                .withProperty("app.cors.allowed-origins", "https://staging.example")
                .withProperty("spring.datasource.url", "jdbc:mysql://rds/db")
                .withProperty("app.s3.bucket", "staging-bucket");

        assertThatThrownBy(() -> RuntimeProfilePolicy.requirePublicDeploymentSettings(staging))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void rejectsPublicProfileWhenAnalyticsSaltIsMissingOrReusesJwtSecret() {
        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        staging.withProperty("jwt.secret", "a_secure_jwt_secret_that_is_longer_than_32_chars")
                .withProperty("app.analytics.hash-salt", "a_secure_jwt_secret_that_is_longer_than_32_chars");

        assertThatThrownBy(() -> RuntimeProfilePolicy.requirePublicDeploymentSettings(staging))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ANALYTICS_HASH_SALT");
    }

    @Test
    void acceptsVerifiedPublicReleaseSettings() {
        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        staging.withProperty("jwt.secret", "a_secure_jwt_secret_that_is_longer_than_32_chars")
                .withProperty("app.analytics.hash-salt", "a_distinct_analytics_salt_longer_than_32_chars")
                .withProperty("app.mail.mode", "smtp")
                .withProperty("app.bootstrap.enabled", "false")
                .withProperty("app.cors.allowed-origins", "https://staging.example")
                .withProperty("spring.datasource.url", "jdbc:mysql://rds/db?sslMode=VERIFY_IDENTITY&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12&fallbackToSystemTrustStore=false")
                .withProperty("app.s3.bucket", "staging-bucket")
                .withProperty("app.admin.access-allowed-cidrs", "10.20.0.0/16")
                .withProperty("app.health-data.encryption-key", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");

        RuntimeProfilePolicy.requirePublicDeploymentSettings(staging);
    }

    @Test
    void rejectsRekeyRunnerInProduction() {
        MockEnvironment production = new MockEnvironment();
        production.setActiveProfiles("prod");
        production.withProperty("jwt.secret", "a_secure_jwt_secret_that_is_longer_than_32_chars")
                .withProperty("app.analytics.hash-salt", "a_distinct_analytics_salt_longer_than_32_chars")
                .withProperty("app.mail.mode", "smtp")
                .withProperty("app.bootstrap.enabled", "false")
                .withProperty("app.cors.allowed-origins", "https://herpfree.co.kr")
                .withProperty("spring.datasource.url", "jdbc:mysql://rds/db?sslMode=VERIFY_IDENTITY&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12&fallbackToSystemTrustStore=false")
                .withProperty("app.s3.bucket", "production-bucket")
                .withProperty("app.admin.access-allowed-cidrs", "10.20.0.0/16")
                .withProperty("app.health-data.encryption-key", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
                .withProperty("app.health-data.rekey-on-startup", "true");

        assertThatThrownBy(() -> RuntimeProfilePolicy.requirePublicDeploymentSettings(production))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("HEALTH_DATA_REKEY_ON_STARTUP");
    }

    @Test
    void rejectsStaticS3CredentialsInPublicProfile() {
        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        staging.withProperty("jwt.secret", "a_secure_jwt_secret_that_is_longer_than_32_chars")
                .withProperty("app.analytics.hash-salt", "a_distinct_analytics_salt_longer_than_32_chars")
                .withProperty("app.mail.mode", "smtp")
                .withProperty("app.bootstrap.enabled", "false")
                .withProperty("app.cors.allowed-origins", "https://staging.example")
                .withProperty("spring.datasource.url", "jdbc:mysql://rds/db?sslMode=VERIFY_IDENTITY&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12&fallbackToSystemTrustStore=false")
                .withProperty("app.s3.bucket", "staging-bucket")
                .withProperty("app.s3.access-key", "AKIAEXAMPLE")
                .withProperty("app.admin.access-allowed-cidrs", "10.20.0.0/16")
                .withProperty("app.health-data.encryption-key", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");

        assertThatThrownBy(() -> RuntimeProfilePolicy.requirePublicDeploymentSettings(staging))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("static S3 keys");
    }

    @Test
    void rejectsPublicProfileWithoutRestrictedAdminGate() {
        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        staging.withProperty("jwt.secret", "a_secure_jwt_secret_that_is_longer_than_32_chars")
                .withProperty("app.analytics.hash-salt", "a_distinct_analytics_salt_longer_than_32_chars")
                .withProperty("app.mail.mode", "smtp")
                .withProperty("app.bootstrap.enabled", "false")
                .withProperty("app.cors.allowed-origins", "https://staging.example")
                .withProperty("spring.datasource.url", "jdbc:mysql://rds/db?sslMode=VERIFY_IDENTITY&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12&fallbackToSystemTrustStore=false")
                .withProperty("app.s3.bucket", "staging-bucket")
                .withProperty("app.health-data.encryption-key", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");

        assertThatThrownBy(() -> RuntimeProfilePolicy.requirePublicDeploymentSettings(staging))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_ACCESS_ALLOWED_CIDRS");
    }

    @Test
    void rejectsAdminGateThatCoversTheEntireInternet() {
        MockEnvironment staging = new MockEnvironment();
        staging.setActiveProfiles("staging");
        staging.withProperty("jwt.secret", "a_secure_jwt_secret_that_is_longer_than_32_chars")
                .withProperty("app.analytics.hash-salt", "a_distinct_analytics_salt_longer_than_32_chars")
                .withProperty("app.mail.mode", "smtp")
                .withProperty("app.bootstrap.enabled", "false")
                .withProperty("app.cors.allowed-origins", "https://staging.example")
                .withProperty("spring.datasource.url", "jdbc:mysql://rds/db?sslMode=VERIFY_IDENTITY&trustCertificateKeyStoreUrl=file:/app/certs/rds-truststore.p12&fallbackToSystemTrustStore=false")
                .withProperty("app.s3.bucket", "staging-bucket")
                .withProperty("app.admin.access-allowed-cidrs", "0.0.0.0/00")
                .withProperty("app.health-data.encryption-key", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");

        assertThatThrownBy(() -> RuntimeProfilePolicy.requirePublicDeploymentSettings(staging))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_ACCESS_ALLOWED_CIDRS");
    }
}
