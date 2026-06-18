package com.herfree.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.s3")
public record S3Properties(
        String bucket,
        String region,
        String accessKey,
        String secretKey,
        /** 공개 URL 베이스(선택). 미설정 시 https://{bucket}.s3.{region}.amazonaws.com 사용 */
        String publicBaseUrl
) {
}
