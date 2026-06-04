package com.herfree.global.response;

public record ErrorResponse(boolean success, String message, Object data) {

    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message, null);
    }
}
