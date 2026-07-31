package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HealthInsightPublicationPolicyTest {

    private final HealthInsightPublicationPolicy policy = new HealthInsightPublicationPolicy();

    @Test
    void appliesCohortAndCellDisclosureThresholds() {
        assertThat(policy.canPublishCohort(19)).isFalse();
        assertThat(policy.canPublishCohort(20)).isTrue();
        assertThat(policy.canPublishCell(4)).isFalse();
        assertThat(policy.canPublishCell(5)).isTrue();
    }

    @Test
    void roundsToFivePercentBuckets() {
        assertThat(policy.roundedPercentage(6, 21)).isEqualTo(30);
        assertThat(policy.roundedPercentage(5, 20)).isEqualTo(25);
    }
}
