package com.herfree.domain.user.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateHealthDataConsentRequest(@NotNull Boolean agreed) {
}
