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
import org.springframework.util.StringUtils;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final MediaType JSON_UTF8 = new MediaType("application", "json", StandardCharsets.UTF_8);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        return jsonResponse(errorCode.getHttpStatus(), ErrorResponse.of(ex.getMessage()));
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
