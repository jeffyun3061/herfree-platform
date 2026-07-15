package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("YoutubeUtils")
class YoutubeUtilsTest {

    @ParameterizedTest
    @CsvSource({
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ, dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ, dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ, dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ, dQw4w9WgXcQ"
    })
    @DisplayName("허용된 YouTube HTTPS 주소에서 영상 ID를 추출한다")
    void extractVideoId_validUrl(String url, String expected) {
        assertThat(YoutubeUtils.extractVideoId(url)).isEqualTo(expected);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://evil.example/watch?v=dQw4w9WgXcQ",
            "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
            "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com/watch?v=too-short",
            "javascript:alert(1)"
    })
    @DisplayName("외부 호스트와 안전하지 않은 주소를 거부한다")
    void extractVideoId_invalidUrl(String url) {
        assertThat(YoutubeUtils.extractVideoId(url)).isEmpty();
    }
}
