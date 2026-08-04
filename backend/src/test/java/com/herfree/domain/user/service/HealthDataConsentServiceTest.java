package com.herfree.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.lenient;

import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.user.entity.HealthDataConsent;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.HealthDataConsentRepository;
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
class HealthDataConsentServiceTest {

    @Mock
    private HealthDataConsentRepository consentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @InjectMocks
    private HealthDataConsentService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("health-consent@example.com")
                .password("hash")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(user, "id", 42L);
        lenient().when(userRepository.findByIdAndStatus(42L, UserStatus.ACTIVE)).thenReturn(Optional.of(user));
    }

    @Test
    void noDecision_requiresConsent() {
        given(consentRepository.findFirstByUserIdOrderByIdDesc(42L)).willReturn(Optional.empty());

        assertThat(service.getConsent(42L).agreed()).isFalse();
        assertThatThrownBy(() -> service.assertAgreed(42L))
                .isInstanceOf(HealthDataConsentRequiredException.class);
    }

    @Test
    void initialDecision_isAppendOnlyAndUsesCurrentPolicy() {
        service.recordInitialConsent(user, true);

        ArgumentCaptor<HealthDataConsent> captor = ArgumentCaptor.forClass(HealthDataConsent.class);
        verify(consentRepository).save(captor.capture());
        assertThat(captor.getValue().isAgreed()).isTrue();
        assertThat(captor.getValue().getPolicyVersion()).isEqualTo(HealthDataConsentService.POLICY_VERSION);
        assertThat(captor.getValue().getSource()).isEqualTo("SIGNUP");
    }

    @Test
    void revocation_deletesJournalBeforeAppendingFalseDecision() {
        HealthDataConsent current = HealthDataConsent.builder()
                .user(user)
                .agreed(true)
                .policyVersion(HealthDataConsentService.POLICY_VERSION)
                .source("SIGNUP")
                .build();
        given(consentRepository.findFirstByUserIdOrderByIdDesc(42L)).willReturn(Optional.of(current));

        var response = service.updateConsent(42L, false);

        assertThat(response.agreed()).isFalse();
        verify(journalRecordRepository).deleteAllByUserId(42L);
        verify(consentRepository).save(any(HealthDataConsent.class));
    }

    @Test
    void legacyPolicyDecision_requiresReConsent() {
        HealthDataConsent legacy = HealthDataConsent.builder()
                .user(user)
                .agreed(true)
                .policyVersion("legacy-2026-07-15")
                .source("MIGRATION")
                .build();
        given(consentRepository.findFirstByUserIdOrderByIdDesc(42L)).willReturn(Optional.of(legacy));

        assertThat(service.getConsent(42L).agreed()).isFalse();
        assertThatThrownBy(() -> service.assertAgreed(42L))
                .isInstanceOf(HealthDataConsentRequiredException.class);
    }
}
