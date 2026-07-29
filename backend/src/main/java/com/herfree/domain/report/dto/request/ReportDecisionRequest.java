package com.herfree.domain.report.dto.request;

import com.herfree.domain.report.entity.ReportStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportDecisionRequest(
        @NotNull ReportStatus status,
        @NotBlank @Size(max = 500) String processNote,
        @NotNull ModerationAction moderationAction
) {
    @AssertTrue(message = "Only accepted reports can mutate their target.")
    public boolean isConsistentDecision() {
        return moderationAction == ModerationAction.NONE || status == ReportStatus.ACCEPTED;
    }

    public ReportProcessRequest toProcessRequest() {
        return new ReportProcessRequest(status, processNote);
    }
}
