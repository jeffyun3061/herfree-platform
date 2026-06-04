package com.herfree.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI herfreeOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Herfree API")
                        .description("Herfree Platform REST API")
                        .version("0.1.0"));
    }
}
