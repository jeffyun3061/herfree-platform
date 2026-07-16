package com.herfree.global.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.herfree.global.response.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void mapsConcurrentEmailUniqueViolationToConflict() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "constraint",
                new RuntimeException("Duplicate entry for key 'uk_users_email'"));

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo(ErrorCode.DUPLICATE_EMAIL.getMessage());
    }

    @Test
    void doesNotExposeUnknownDatabaseDetails() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "secret database detail",
                new RuntimeException("unexpected database constraint"));

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo(ErrorCode.INTERNAL_ERROR.getMessage());
    }
}
