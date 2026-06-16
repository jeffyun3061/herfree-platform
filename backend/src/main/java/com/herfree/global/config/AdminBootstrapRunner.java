package com.herfree.global.config;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.ReservedNicknamePolicy;
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
            log.warn("Admin bootstrap enabled but ADMIN_EMAIL or ADMIN_PASSWORD is empty — skipped.");
            return;
        }

        String email = bootstrapProperties.email().trim();
        if (userRepository.existsByEmail(email)) {
            log.info("Admin bootstrap skipped — account already exists for {}", email);
            return;
        }

        String nickname = StringUtils.hasText(bootstrapProperties.nickname())
                ? bootstrapProperties.nickname().trim()
                : "운영자";
        if (ReservedNicknamePolicy.isReserved(nickname)) {
            nickname = "HerfreeOps";
        }
        while (userProfileRepository.existsByNickname(nickname)) {
            nickname = nickname + "1";
        }

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

        log.info("Bootstrap SUPER_ADMIN created for {} (nickname={})", email, nickname);
    }
}
