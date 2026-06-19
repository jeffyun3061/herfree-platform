package com.herfree.global.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class S3ConfigurationLogger {

    private final S3Properties s3Properties;

    @EventListener(ApplicationReadyEvent.class)
    public void logS3Status() {
        boolean hasBucket = StringUtils.hasText(s3Properties.bucket());
        boolean hasRegion = StringUtils.hasText(s3Properties.region());
        boolean hasStaticKey = StringUtils.hasText(s3Properties.accessKey())
                && StringUtils.hasText(s3Properties.secretKey());

        if (!hasBucket || !hasRegion || !hasStaticKey) {
            log.warn("S3 image upload NOT ready — check local-secrets.yml (bucket, access-key, secret-key)");
            return;
        }

        log.info("S3 image upload ready: bucket={}, region={}", s3Properties.bucket(), s3Properties.region());
    }
}
