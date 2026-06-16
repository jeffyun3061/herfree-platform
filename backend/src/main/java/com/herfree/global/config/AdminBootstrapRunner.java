package com.herfree.global.config;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.ReservedNicknamePolicy;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@EnableConfigurationProperties(AdminBootstrapProperties.class)
@RequiredArgsConstructor
public class AdminBootstrapRunner implements ApplicationRunner {

    private final AdminBootstrapProperties bootstrapProperties;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!bootstrapProperties.enabled()) {
            return;
        }
        if (!StringUtils.hasText(bootstrapProperties.email())
                || !StringUtils.hasText(bootstrapProperties.password())) {
            log.warn("Admin bootstrap enabled but email/password is empty — skipped.");
            return;
        }

        String email = bootstrapProperties.email().trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent()) {
            if (!bootstrapProperties.syncExisting()) {
                log.info("Admin bootstrap skipped — account already exists for {}", email);
                return;
            }
            syncExistingAdmin(existing.get());
            return;
        }

        createAdmin(email);
    }

    private void syncExistingAdmin(User user) {
        user.changeRole(UserRole.SUPER_ADMIN);
        user.changePassword(passwordEncoder.encode(bootstrapProperties.password()));
        if (user.getStatus() != UserStatus.ACTIVE) {
            user.activate();
        }
        userRepository.save(user);
        log.info("Bootstrap synced existing account to SUPER_ADMIN: {}", user.getEmail());
    }

    private void createAdmin(String email) {
        String nickname = resolveNickname();

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(bootstrapProperties.password()))
                .role(UserRole.SUPER_ADMIN)
                .build();
        userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname(nickname)
                .isPublic(false)
                .build();
        userProfileRepository.save(profile);

        log.info("Bootstrap SUPER_ADMIN created: {} (nickname={})", email, nickname);
    }

    private String resolveNickname() {
        String nickname = StringUtils.hasText(bootstrapProperties.nickname())
                ? bootstrapProperties.nickname().trim()
                : "HerfreeOps";
        if (ReservedNicknamePolicy.isReserved(nickname)) {
            nickname = "HerfreeOps";
        }
        while (userProfileRepository.existsByNickname(nickname)) {
            nickname = nickname + "1";
        }
        return nickname;
    }
}
