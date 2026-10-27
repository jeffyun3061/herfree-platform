package com.herfree.domain.user.dto.response;
import java.time.Instant;
public record CommunityHealthConsentResponse(boolean agreed, Boolean latestDecisionAgreed, String requiredPolicyVersion, String policyVersion,
        String purpose, Instant decidedAt, Long deletionRequestId) {}
