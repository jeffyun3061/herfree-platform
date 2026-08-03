package com.herfree.domain.analytics.service;

import com.herfree.domain.analytics.entity.AppEventLog;
import com.herfree.domain.analytics.repository.AppEventLogRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Persists backend analytics after the business transaction has committed. */
@Service
@RequiredArgsConstructor
public class AnalyticsEventWriter {

    private final AppEventLogRepository eventLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(String eventName, Long userId) {
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        eventLogRepository.save(AppEventLog.builder()
                .eventName(eventName)
                .source("BACKEND")
                .user(user)
                .sessionHash(null)
                .ipHash(null)
                .userAgentHash(null)
                .build());
    }
}
