package com.herfree.global.util;

import java.util.Locale;
import java.util.Set;

public final class ReservedNicknamePolicy {

    private static final Set<String> RESERVED = Set.of(
            "관리자",
            "admin",
            "administrator",
            "moderator",
            "운영자",
            "operator",
            "herfree",
            "허프리",
            "system",
            "시스템"
    );

    private ReservedNicknamePolicy() {
    }

    public static boolean isReserved(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return false;
        }
        String normalized = nickname.trim().toLowerCase(Locale.ROOT);
        return RESERVED.contains(normalized) || RESERVED.contains(nickname.trim());
    }
}
