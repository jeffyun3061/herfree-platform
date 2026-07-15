package com.herfree.global.util;

import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

// 유튜브 URL 파싱 유틸리티 — Spring Bean이 아닌 순수 정적 메서드로 제공한다.
// VideoService 외에 다른 도메인(예: Content)에서도 유튜브 URL을 다룰 때 재사용할 수 있도록
// global/util로 분리했다.
public final class YoutubeUtils {

    private static final Pattern VIDEO_ID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{11}$");
    private static final Set<String> YOUTUBE_HOSTS = Set.of(
            "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
            "youtube-nocookie.com", "www.youtube-nocookie.com"
    );

    private YoutubeUtils() {
        // 인스턴스 생성을 막아 static 유틸리티 클래스 계약을 명시한다
    }

    // 유튜브 URL에서 videoId를 추출한다.
    // videoId를 DB에 미리 저장하는 이유:
    // 썸네일(https://img.youtube.com/vi/{videoId}/mqdefault.jpg)과
    // 임베드 URL(https://www.youtube.com/embed/{videoId}) 생성 시 매번 URL을 파싱하는 비용을 없애기 위함이다.
    //
    // 지원 형식:
    //   - https://www.youtube.com/watch?v=VIDEO_ID
    //   - https://youtu.be/VIDEO_ID
    //   - https://www.youtube.com/embed/VIDEO_ID
    //
    // 지원하지 않는 형식은 빈 문자열을 반환한다.
    public static String extractVideoId(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        try {
            URI uri = URI.create(url.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                return "";
            }

            String host = uri.getHost().toLowerCase(Locale.ROOT);
            String candidate;
            if ("youtu.be".equals(host) || "www.youtu.be".equals(host)) {
                candidate = firstPathSegment(uri.getPath());
            } else if (YOUTUBE_HOSTS.contains(host)) {
                candidate = extractFromYoutubeUri(uri);
            } else {
                return "";
            }
            return VIDEO_ID_PATTERN.matcher(candidate).matches() ? candidate : "";
        } catch (IllegalArgumentException ex) {
            return "";
        }
    }

    private static String extractFromYoutubeUri(URI uri) {
        String path = uri.getPath() == null ? "" : uri.getPath();
        if ("/watch".equals(path)) {
            String query = uri.getRawQuery();
            if (query != null) {
                for (String pair : query.split("&")) {
                    String[] keyValue = pair.split("=", 2);
                    if (keyValue.length == 2 && "v".equals(keyValue[0])) {
                        return keyValue[1];
                    }
                }
            }
            return "";
        }
        for (String prefix : new String[]{"/embed/", "/shorts/", "/live/"}) {
            if (path.startsWith(prefix)) {
                return firstPathSegment(path.substring(prefix.length()));
            }
        }
        return "";
    }

    private static String firstPathSegment(String path) {
        if (path == null) {
            return "";
        }
        String normalized = path.startsWith("/") ? path.substring(1) : path;
        int slash = normalized.indexOf('/');
        return slash >= 0 ? normalized.substring(0, slash) : normalized;
    }

    public static String defaultThumbnailUrl(String videoId) {
        if (videoId == null || videoId.isBlank()) {
            return "";
        }
        return "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg";
    }
}
