package com.herfree.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.herfree.global.exception.ErrorCode;

public record ErrorResponse(
        boolean success,
        String message,
        Object data,
        @JsonInclude(JsonInclude.Include.NON_NULL) String code
) {

    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message, null, null);
    }

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(false, errorCode.getMessage(), null, errorCode.name());
    }
}
