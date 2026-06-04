package com.herfree;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class HerfreeApplication {

    public static void main(String[] args) {
        SpringApplication.run(HerfreeApplication.class, args);
    }
}
