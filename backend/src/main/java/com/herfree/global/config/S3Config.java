package com.herfree.global.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class S3Config {

    @Bean
    public S3Client s3Client(S3Properties properties) {
        return S3Client.builder()
                .region(Region.of(properties.region()))
                .credentialsProvider(credentialsProvider(properties))
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(S3Properties properties) {
        return S3Presigner.builder()
                .region(Region.of(properties.region()))
                .credentialsProvider(credentialsProvider(properties))
                .build();
    }

    private AwsCredentialsProvider credentialsProvider(S3Properties properties) {
        boolean hasAccessKey = StringUtils.hasText(properties.accessKey());
        boolean hasSecretKey = StringUtils.hasText(properties.secretKey());

        if (hasAccessKey && hasSecretKey) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(properties.accessKey(), properties.secretKey()));
        }
        // access-key만 있고 secret이 비어 있으면 DefaultCredentialsProvider로 넘어가
        // Windows 로컬에서 SdkClientException → 500이 난다. 명시적으로 실패시킨다.
        if (hasAccessKey) {
            throw new IllegalStateException(
                    "S3 secret key is missing. Set S3_SECRET_KEY (or AWS_SECRET_ACCESS_KEY) via environment variables only.");
        }
        return DefaultCredentialsProvider.create();
    }
}
