package com.herfree.domain.user.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateHealthStatisticsConsentRequest(@NotNull Boolean agreed) {
}
