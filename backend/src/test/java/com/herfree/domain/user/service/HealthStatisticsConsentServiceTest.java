package com.herfree.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.user.entity.HealthStatisticsConsent;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.HealthStatisticsConsentRepository;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class HealthStatisticsConsentServiceTest {

    @Mock
    private HealthStatisticsConsentRepository consentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private HealthStatisticsConsentService consentService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("consent-service@herfree.local")
                .password("encoded")
                .status(UserStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
        given(userRepository.findByIdAndStatus(1L, UserStatus.ACTIVE)).willReturn(Optional.of(user));
    }

    @Test
    void updateConsentAppendsWithdrawalHistory() {
        HealthStatisticsConsent current = HealthStatisticsConsent.builder()
                .user(user)
                .agreed(true)
                .policyVersion("2026-07-16")
                .build();
        given(consentRepository.findFirstByUserIdOrderByIdDesc(1L)).willReturn(Optional.of(current));

        var response = consentService.updateConsent(1L, false);

        ArgumentCaptor<HealthStatisticsConsent> captor =
                ArgumentCaptor.forClass(HealthStatisticsConsent.class);
        verify(consentRepository).save(captor.capture());
        assertThat(captor.getValue().isAgreed()).isFalse();
        assertThat(response.agreed()).isFalse();
    }

    @Test
    void updateConsentDoesNotDuplicateUnchangedState() {
        HealthStatisticsConsent current = HealthStatisticsConsent.builder()
                .user(user)
                .agreed(true)
                .policyVersion("2026-07-16")
                .build();
        given(consentRepository.findFirstByUserIdOrderByIdDesc(1L)).willReturn(Optional.of(current));

        var response = consentService.updateConsent(1L, true);

        verify(consentRepository, never()).save(any());
        assertThat(response.agreed()).isTrue();
    }
}
