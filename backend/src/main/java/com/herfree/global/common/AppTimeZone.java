package com.herfree.global.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class AppTimeZone {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");
    public static final ZoneId UTC = ZoneId.of("UTC");

    private static final DateTimeFormatter MYSQL_UTC_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(UTC);

    private AppTimeZone() {
    }

    public static LocalDate todayKst() {
        return LocalDate.now(KST);
    }

    public static Instant startOfTodayKst() {
        return LocalDate.now(KST).atStartOfDay(KST).toInstant();
    }

    public static String formatMysqlUtc(Instant instant) {
        return MYSQL_UTC_FORMAT.format(instant);
    }
}
