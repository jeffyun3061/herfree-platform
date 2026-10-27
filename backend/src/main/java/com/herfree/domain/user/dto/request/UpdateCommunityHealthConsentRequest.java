package com.herfree.domain.user.dto.request;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record UpdateCommunityHealthConsentRequest(@NotNull Boolean agreed, @Size(max=20) String policyVersion) {}
