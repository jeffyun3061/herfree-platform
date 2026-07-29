package com.herfree.domain.journal.service;

import org.springframework.stereotype.Component;

/**
 * Privacy boundary for aggregate health insights.
 *
 * <p>Disclosure thresholds and rounding live in one policy so callers cannot accidentally expose
 * a smaller cohort or a more precise percentage.</p>
 */
@Component
public class HealthInsightPublicationPolicy {

    static final int MIN_PARTICIPANTS = 20;
    static final int MIN_CELL_PARTICIPANTS = 5;
    static final int PERCENTAGE_BUCKET = 5;

    boolean canPublishCohort(int distinctParticipants) {
        return distinctParticipants >= MIN_PARTICIPANTS;
    }

    boolean canPublishCell(int distinctParticipants) {
        return distinctParticipants >= MIN_CELL_PARTICIPANTS;
    }

    int roundedPercentage(int cellParticipants, int cohortParticipants) {
        if (cohortParticipants <= 0 || cellParticipants <= 0) {
            return 0;
        }
        double percentage = cellParticipants * 100.0 / cohortParticipants;
        int rounded = (int) Math.round(percentage / PERCENTAGE_BUCKET) * PERCENTAGE_BUCKET;
        return Math.max(0, Math.min(100, rounded));
    }
}
