package com.herfree.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통 — 특정 도메인에 묶이지 않는 범용 코드
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "이미 존재하는 리소스입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증(Auth) — 회원가입·로그인·토큰 관련 오류
    // 중복 이메일은 Conflict(409)로 분리해야 클라이언트가 "이미 가입된 계정" UI를 정확히 표시할 수 있다
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    // 닉네임 중복도 이메일과 동일한 이유로 Conflict 사용
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    RESERVED_NICKNAME(HttpStatus.BAD_REQUEST, "사용할 수 없는 닉네임입니다."),
    // 비밀번호 불일치는 403이 아닌 401 — "인증 자격증명 자체가 틀렸다"는 의미
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다."),
    // 로그인 실패(이메일 없음·비밀번호 불일치) — 존재 여부를 구분하지 않는 통합 메시지
    INVALID_LOGIN_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    // JWT 위조·만료 모두 401로 통일 — 클라이언트는 재로그인 유도
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    // 정지된 계정은 401이 아닌 403으로 처리한다.
    // 자격증명 자체는 유효하지만 서비스 접근이 금지된 상태이기 때문이다.
    // 클라이언트는 이 코드를 받으면 "계정이 정지됐습니다" 안내를 표시한다.
    SUSPENDED_ACCOUNT(HttpStatus.FORBIDDEN, "정지된 계정입니다. 운영자에게 문의하세요."),

    // 사용자(User) — 회원 조회·권한 관련 오류
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    // 403은 인증은 됐지만 해당 리소스에 대한 권한이 없을 때 사용
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // 게시판(Board)
    BOARD_NOT_FOUND(HttpStatus.NOT_FOUND, "게시판을 찾을 수 없습니다."),

    // 게시글(Post)
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    // 본인 글이 아닌 게시글을 수정·삭제하려 할 때 403을 반환해 클라이언트가 구분할 수 있게 한다
    POST_ACCESS_DENIED(HttpStatus.FORBIDDEN, "게시글에 대한 권한이 없습니다."),

    // 댓글(Comment)
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    COMMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "댓글에 대한 권한이 없습니다."),

    // 반응(Reaction) — 동일 대상에 동일 반응을 중복으로 등록하려 할 때 409 반환
    DUPLICATE_REACTION(HttpStatus.CONFLICT, "이미 등록한 반응입니다."),

    // 신고(Report)
    DUPLICATE_REPORT(HttpStatus.CONFLICT, "이미 신고한 대상입니다."),
    SELF_REPORT_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "본인이 작성한 콘텐츠는 신고할 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고 내역을 찾을 수 없습니다."),

    // 콘텐츠(Content)
    CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "콘텐츠를 찾을 수 없습니다."),

    // 영상(Video)
    VIDEO_NOT_FOUND(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."),

    // 제품(Product)
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "제품을 찾을 수 없습니다."),

    // 개인 일지(Journal)
    JOURNAL_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다."),

    // 권한·역할
    ROLE_CHANGE_NOT_ALLOWED(HttpStatus.FORBIDDEN, "권한을 변경할 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
