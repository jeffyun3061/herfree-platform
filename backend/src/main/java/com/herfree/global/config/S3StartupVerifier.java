package com.herfree.global.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.S3Exception;

/** 기동 시 S3 버킷·권한을 검증해 업로드 실패 원인을 로그에 남긴다 */
@Component
@RequiredArgsConstructor
@Slf4j
public class S3StartupVerifier {

    private final S3Properties s3Properties;
    private final S3Client s3Client;

    @EventListener(ApplicationReadyEvent.class)
    public void verifyBucketOnStartup() {
        if (!StringUtils.hasText(s3Properties.bucket())
                || !StringUtils.hasText(s3Properties.accessKey())
                || !StringUtils.hasText(s3Properties.secretKey())) {
            log.warn("S3 startup check skipped — bucket or credentials missing in config");
            return;
        }

        try {
            // HeadBucket 은 IAM 에서 s3:ListBucket 이 함께 필요하다.
            // 업로드 경로(posts/*) 기준으로 ListBucket 권한만 검증한다.
            s3Client.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(s3Properties.bucket())
                    .prefix("posts/")
                    .maxKeys(1)
                    .build());
            log.info("S3 startup check OK — bucket '{}' reachable (region={})",
                    s3Properties.bucket(), s3Properties.region());
        } catch (S3Exception ex) {
            String code = ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorCode() : "Unknown";
            log.error("S3 startup check FAILED — bucket='{}' region={} errorCode={} message={}",
                    s3Properties.bucket(), s3Properties.region(), code, ex.getMessage());
            log.error(
                    "Fix: (1) bucket/region in local-secrets.yml (2) IAM s3:PutObject + s3:ListBucket on arn:aws:s3:::{}/posts/*",
                    s3Properties.bucket());
        } catch (Exception ex) {
            log.error("S3 startup check FAILED — {}", ex.getMessage());
        }
    }
}
