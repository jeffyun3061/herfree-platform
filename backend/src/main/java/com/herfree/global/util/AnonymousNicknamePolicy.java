package com.herfree.global.util;

public final class AnonymousNicknamePolicy {

    public static final String ANONYMOUS_LABEL = "익명";
    public static final String ANONYMOUS_SELF_LABEL = "익명(나)";

    private AnonymousNicknamePolicy() {
    }

    public static String displayNickname(boolean anonymous, boolean isAuthor, String nickname) {
        if (!anonymous) {
            return nickname;
        }
        return isAuthor ? ANONYMOUS_SELF_LABEL : ANONYMOUS_LABEL;
    }
}
