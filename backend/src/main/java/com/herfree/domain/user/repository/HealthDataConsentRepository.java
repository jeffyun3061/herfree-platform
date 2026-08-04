package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.HealthDataConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthDataConsentRepository extends JpaRepository<HealthDataConsent, Long> {

    Optional<HealthDataConsent> findFirstByUserIdOrderByIdDesc(Long userId);
}
