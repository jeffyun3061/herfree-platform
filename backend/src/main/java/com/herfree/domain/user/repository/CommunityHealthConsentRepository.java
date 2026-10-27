package com.herfree.domain.user.repository;
import com.herfree.domain.user.entity.CommunityHealthConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
public interface CommunityHealthConsentRepository extends JpaRepository<CommunityHealthConsent, Long> {
    Optional<CommunityHealthConsent> findFirstByUserIdOrderByIdDesc(Long userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CommunityHealthConsent> findTopByUserIdOrderByIdDesc(Long userId);
}
