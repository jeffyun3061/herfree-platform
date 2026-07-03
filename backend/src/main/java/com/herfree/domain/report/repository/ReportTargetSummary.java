package com.herfree.domain.report.repository;

import com.herfree.domain.report.entity.ReportTargetType;
import java.time.LocalDateTime;

public interface ReportTargetSummary {

    ReportTargetType getTargetType();

    Long getTargetId();

    long getReportCount();

    LocalDateTime getLastReportedAt();
}
