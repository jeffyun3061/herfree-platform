package com.herfree.global.exception;

import com.herfree.global.response.ErrorResponse;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import software.amazon.awssdk.core.exception.SdkClientException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final MediaType JSON_UTF8 = new MediaType("application", "json", StandardCharsets.UTF_8);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        return jsonResponse(errorCode.getHttpStatus(), ErrorResponse.of(errorCode));
    }

    // MethodArgumentNotValidException이 BindException을 상속하므로
    // 파라미터 타입을 BindException으로 통일하면 instanceof 분기 없이 같은 방식으로 처리할 수 있다.
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ErrorResponse> handleValidationException(BindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        // 필드 에러가 없는 경우(글로벌 에러만 있는 경우)에도 기본 메시지를 보장한다
        if (!StringUtils.hasText(message)) {
            message = ErrorCode.INVALID_INPUT.getMessage();
        }

        return jsonResponse(HttpStatus.BAD_REQUEST, ErrorResponse.of(message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return jsonResponse(HttpStatus.BAD_REQUEST, ErrorResponse.of(ErrorCode.INVALID_INPUT.getMessage()));
    }

    @ExceptionHandler(SdkClientException.class)
    public ResponseEntity<ErrorResponse> handleSdkClient(SdkClientException ex) {
        log.error("S3 client error. failureType={}", ex.getClass().getSimpleName());
        return jsonResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorResponse.of(ErrorCode.S3_NOT_CONFIGURED.getMessage())
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        // 사전 중복 검사는 UX용이고, 최종 보장은 DB unique 제약이다.
        // 동시 요청이 사전 검사를 함께 통과해도 제약 이름만 해석해 일관된 409를 반환한다.
        String detail = ex.getMostSpecificCause().getMessage();
        String normalized = detail == null ? "" : detail.toLowerCase(java.util.Locale.ROOT);
        if (normalized.contains("uk_users_email")) {
            return jsonResponse(
                    ErrorCode.DUPLICATE_EMAIL.getHttpStatus(),
                    ErrorResponse.of(ErrorCode.DUPLICATE_EMAIL.getMessage()));
        }
        if (normalized.contains("uk_user_profiles_nickname")) {
            return jsonResponse(
                    ErrorCode.DUPLICATE_NICKNAME.getHttpStatus(),
                    ErrorResponse.of(ErrorCode.DUPLICATE_NICKNAME.getMessage()));
        }
        if (normalized.contains("uk_reactions_user_target_type")) {
            return jsonResponse(
                    ErrorCode.DUPLICATE_REACTION.getHttpStatus(),
                    ErrorResponse.of(ErrorCode.DUPLICATE_REACTION.getMessage()));
        }
        if (normalized.contains("uk_journal_user_date")) {
            return jsonResponse(
                    ErrorCode.CONFLICT.getHttpStatus(),
                    ErrorResponse.of(ErrorCode.CONFLICT.getMessage()));
        }

        log.error(
                "Unhandled data integrity violation. failureType={}",
                ex.getMostSpecificCause().getClass().getSimpleName());
        return jsonResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorResponse.of(ErrorCode.INTERNAL_ERROR.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error("Unhandled exception", ex);
        return jsonResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorResponse.of(ErrorCode.INTERNAL_ERROR.getMessage())
        );
    }

    private ResponseEntity<ErrorResponse> jsonResponse(HttpStatus status, ErrorResponse body) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.CONTENT_TYPE, JSON_UTF8.toString())
                .body(body);
    }
}
