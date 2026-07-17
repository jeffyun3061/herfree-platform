package com.herfree.domain.audit.service;

import com.herfree.domain.audit.entity.AdminAuditLog;
import com.herfree.domain.audit.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 API 호출 감사 로그 — REQUIRES_NEW로 본 트랜잭션 롤백과 분리 저장.
 */
@Service
@RequiredArgsConstructor
public class AdminAuditService {

    private final AdminAuditLogRepository adminAuditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long actorUserId, String method, String path, int status, String requestId) {
        adminAuditLogRepository.save(AdminAuditLog.create(
                actorUserId,
                limit(method, 10),
                limit(path, 255),
                status,
                limit(requestId, 64)
        ));
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
