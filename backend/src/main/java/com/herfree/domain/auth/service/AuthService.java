package com.herfree.domain.auth.service;

import com.herfree.domain.auth.dto.request.LoginRequest;
import com.herfree.domain.auth.dto.request.SignupRequest;
import com.herfree.domain.auth.dto.response.LoginResponse;
import com.herfree.domain.auth.exception.InvalidPasswordException;
import com.herfree.domain.auth.exception.SuspendedAccountException;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateEmailException;
import com.herfree.domain.user.exception.DuplicateNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.security.JwtProperties;
import com.herfree.global.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    // 회원가입 — User와 UserProfile을 같은 트랜잭션에서 함께 저장한다.
    // 프로필 저장이 실패하면 User도 롤백되어 孤立된 인증 레코드가 생기지 않는다.
    @Transactional
    public void signup(SignupRequest request) {
        // 이메일 중복 체크 — DB unique 제약으로도 잡히지만,
        // 명시적으로 검증해야 의도가 담긴 에러 메시지를 내려줄 수 있다.
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException();
        }

        // 닉네임 중복 체크 — user_profiles.nickname은 unique 컬럼이다.
        if (userProfileRepository.existsByNickname(request.nickname())) {
            throw new DuplicateNicknameException();
        }

        // BCrypt를 쓰는 이유:
        // 단방향 해시 + salt를 자동으로 붙여줘서 동일한 비밀번호도 다른 해시값이 나온다.
        // Rainbow table 공격을 방어하면서 해시 복잡도(cost factor)를 설정으로 조절할 수 있다.
        String encodedPassword = passwordEncoder.encode(request.password());

        User user = User.builder()
                .email(request.email())
                .password(encodedPassword)
                .build();

        userRepository.save(user);

        // User와 UserProfile을 분리 테이블로 관리하는 이유:
        // 인증 정보(이메일·비밀번호)와 커뮤니티 노출 정보(닉네임·이미지)의
        // 변경 주기와 노출 범위가 다르다. 분리하면 각 테이블을 독립적으로 변경·확장할 수 있다.
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname(request.nickname())
                .isPublic(true)
                .build();

        userProfileRepository.save(profile);
    }

    // 로그인 — 이메일로 사용자를 찾고, 비밀번호를 검증한 뒤 JWT를 발급한다.
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 이메일로 사용자 조회 — 존재하지 않으면 UserNotFoundException
        // 보안 관점에서 "이메일이 없다"와 "비밀번호가 틀렸다"를 같은 흐름으로 처리하는 게 맞지만,
        // 여기서는 UX 편의를 위해 분리한다. 실제 응답 메시지는 동일하게 유지한다.
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(UserNotFoundException::new);

        // SUSPENDED는 자격증명은 유효하지만 서비스 접근이 금지된 상태다.
        // filter()로 ACTIVE만 통과시키면 SUSPENDED와 DELETED가 모두 UserNotFoundException을 던져
        // 클라이언트가 계정 정지 여부를 알 수 없다. 상태별로 예외를 분리해야 한다.
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new SuspendedAccountException();
        }

        // DELETED 계정은 탈퇴 처리된 것으로, 존재하지 않는 계정과 동일하게 처리한다.
        // 탈퇴 계정 존재 여부를 공개하면 개인정보 유출이 될 수 있으므로
        // UserNotFoundException과 동일한 메시지를 사용한다.
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UserNotFoundException();
        }

        // PasswordEncoder.matches()는 요청 평문과 저장된 BCrypt 해시를 비교한다.
        // 직접 해시를 만들어 비교하면 salt 처리가 누락되므로 반드시 이 메서드를 써야 한다.
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidPasswordException();
        }

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(UserNotFoundException::new);

        // JWT subject에는 userId를 문자열로 넣고, role claim에 권한을 함께 담는다.
        // role을 토큰에 포함하는 이유: 매 요청마다 DB에서 권한을 조회하지 않아도
        // JwtAuthenticationFilter에서 바로 SecurityContext에 올바른 권한을 설정할 수 있다.
        String accessToken = jwtTokenProvider.createAccessToken(
                String.valueOf(user.getId()), user.getRole().name());

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtProperties.accessExpirationSeconds(),
                user.getId(),
                profile.getNickname(),
                user.getRole()
        );
    }
}
