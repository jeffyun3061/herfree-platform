package com.herfree.global.util;

// 유튜브 URL 파싱 유틸리티 — Spring Bean이 아닌 순수 정적 메서드로 제공한다.
// VideoService 외에 다른 도메인(예: Content)에서도 유튜브 URL을 다룰 때 재사용할 수 있도록
// global/util로 분리했다.
public final class YoutubeUtils {

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

        // youtu.be 단축 URL 처리
        if (url.contains("youtu.be/")) {
            String[] parts = url.split("youtu.be/");
            if (parts.length > 1) {
                return parts[1].split("[?&]")[0];
            }
        }

        // watch?v= 형식 처리
        if (url.contains("v=")) {
            String[] parts = url.split("v=");
            if (parts.length > 1) {
                return parts[1].split("[?&]")[0];
            }
        }

        // embed/ 형식 처리
        if (url.contains("/embed/")) {
            String[] parts = url.split("/embed/");
            if (parts.length > 1) {
                return parts[1].split("[?&]")[0];
            }
        }

        return "";
    }
}
