package com.herfree.global.util;

public final class AnonymousConcernPolicy {
    public static final String BOARD_TYPE = "ANONYMOUS_QUESTION";
    private AnonymousConcernPolicy() {}
    public static boolean isConcernBoard(String boardType) {
        return BOARD_TYPE.equals(boardType);
    }
}
