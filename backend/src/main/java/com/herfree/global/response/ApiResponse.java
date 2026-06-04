package com.herfree.global.response;

public record ApiResponse<T>(boolean success, String message, T data) {

    private static final String DEFAULT_SUCCESS_MESSAGE = "요청이 성공했습니다.";

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, DEFAULT_SUCCESS_MESSAGE, data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
