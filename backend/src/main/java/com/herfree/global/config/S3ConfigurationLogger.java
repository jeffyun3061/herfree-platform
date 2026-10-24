package com.herfree.global.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Emits an operational S3 configuration signal without logging credentials. */
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

        if (!hasBucket || !hasRegion) {
            log.error("S3 image upload is not configured: bucket and region are required");
            return;
        }

        if (hasStaticKey) {
            log.warn("S3 image upload uses configured static credentials; prefer the EC2 instance role");
        } else {
            log.info("S3 image upload uses the AWS default credential chain (instance role expected)");
        }
        log.info("S3 image upload configured: bucket={}, region={}", s3Properties.bucket(), s3Properties.region());
    }
}
