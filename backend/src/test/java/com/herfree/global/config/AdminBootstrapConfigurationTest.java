package com.herfree.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

class AdminBootstrapConfigurationTest {

    @Test
    @DisplayName("관리자 부트스트랩 환경변수는 app.bootstrap 아래에 정의된다")
    @SuppressWarnings("unchecked")
    void bootstrapPropertiesStayInBootstrapSection() {
        InputStream input = getClass().getClassLoader().getResourceAsStream("application.yml");
        assertThat(input).isNotNull();

        Map<String, Object> root;
        try (input) {
            root = (Map<String, Object>) new Yaml().loadAll(input).iterator().next();
        } catch (Exception exception) {
            throw new AssertionError("application.yml을 읽을 수 없습니다.", exception);
        }

        Map<String, Object> app = (Map<String, Object>) root.get("app");
        Map<String, Object> bootstrap = (Map<String, Object>) app.get("bootstrap");
        Map<String, Object> retention = (Map<String, Object>) app.get("retention");

        assertThat(bootstrap).containsKeys("enabled", "email", "password", "nickname", "sync-existing");
        assertThat(retention).doesNotContainKeys("email", "password", "nickname", "sync-existing");
    }
}
