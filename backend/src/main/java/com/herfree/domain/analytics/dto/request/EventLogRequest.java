package com.herfree.domain.analytics.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EventLogRequest(
        @NotBlank @Size(max = 80) String eventName,
        @Size(max = 180) String route,
        @Size(max = 120) String sessionId
) {
}
