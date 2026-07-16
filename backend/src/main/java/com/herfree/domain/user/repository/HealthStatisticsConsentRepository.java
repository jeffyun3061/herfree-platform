package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.HealthStatisticsConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthStatisticsConsentRepository extends JpaRepository<HealthStatisticsConsent, Long> {

    Optional<HealthStatisticsConsent> findFirstByUserIdOrderByIdDesc(Long userId);
}
