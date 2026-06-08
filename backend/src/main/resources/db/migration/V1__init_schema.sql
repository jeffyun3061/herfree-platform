-- =====================================================
-- V1: 핵심 테이블 초기 생성
-- users, user_profiles는 인증 정보와 커뮤니티 노출 정보를
-- 의도적으로 분리한다 (erd.md 설계 원칙 #1).
-- boards는 게시판 구조 기반이므로 여기서 함께 생성한다.
-- =====================================================

-- charset을 utf8mb4로 맞추는 이유:
-- 이모지 등 4바이트 문자를 처리하기 위함이다.
-- MySQL의 utf8은 3바이트까지만 지원한다.

-- 회원 인증 정보 테이블
-- 이메일·비밀번호·권한·계정 상태만 보관한다.
-- 커뮤니티 노출 정보(닉네임 등)는 user_profiles에 분리한다.
CREATE TABLE users
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'USER',
    status     VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    -- 로그인 조회 시 풀스캔 방지
    UNIQUE INDEX uk_users_email (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 사용자 커뮤니티 노출 정보 테이블
-- 닉네임·프로필 이미지·소개는 커뮤니티 활동 단위이므로
-- 인증 정보(users)와 분리하여 프로필 수정이 인증에 영향주지 않도록 한다.
CREATE TABLE user_profiles
(
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NOT NULL,
    nickname          VARCHAR(50)  NOT NULL,
    profile_image_url VARCHAR(500) NULL,
    bio               VARCHAR(500) NULL,
    is_public         TINYINT(1)   NOT NULL DEFAULT 1,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    -- users와 1:1 관계이므로 user_id도 unique
    UNIQUE INDEX uk_user_profiles_user_id (user_id),

    -- 닉네임 중복 방지 및 조회 성능
    UNIQUE INDEX uk_user_profiles_nickname (nickname),

    CONSTRAINT fk_user_profiles_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 게시판 테이블
-- 게시판은 앱 설정성 데이터로, 코드가 아닌 DB로 관리해야
-- 관리자가 런타임에 활성화/비활성화할 수 있다.
CREATE TABLE boards
(
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    board_type  VARCHAR(50)  NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),

    -- board_type은 도메인 코드로 조회하는 경우가 많음
    UNIQUE INDEX uk_boards_board_type (board_type)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
