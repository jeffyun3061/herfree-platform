package com.herfree.domain.report.repository;

import com.herfree.domain.report.entity.ReportTargetType;
import java.time.Instant;

public interface ReportTargetSummary {

    ReportTargetType getTargetType();

    Long getTargetId();

    long getReportCount();

    Instant getLastReportedAt();
}
