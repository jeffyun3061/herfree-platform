package com.herfree.domain.auth.repository;

import com.herfree.domain.auth.entity.OAuthProvider;
import com.herfree.domain.auth.entity.UserOAuthAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserOAuthAccountRepository extends JpaRepository<UserOAuthAccount, Long> {

    Optional<UserOAuthAccount> findByProviderAndProviderUserId(
            OAuthProvider provider,
            String providerUserId
    );

    boolean existsByUserIdAndProvider(Long userId, OAuthProvider provider);

    boolean existsByUserId(Long userId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserOAuthAccount a WHERE a.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
