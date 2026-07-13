package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.UserConsentAgreement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentAgreementRepository extends JpaRepository<UserConsentAgreement, Long> {
}
