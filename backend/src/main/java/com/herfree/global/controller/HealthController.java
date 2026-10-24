package com.herfree.global.controller;

import com.herfree.global.response.ApiResponse;
import java.util.Map;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final Environment environment;

    public HealthController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        String[] activeProfiles = environment.getActiveProfiles();
        String deploymentEnvironment = activeProfiles.length == 1 ? activeProfiles[0] : "unknown";
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "UP",
                "environment", deploymentEnvironment
        )));
    }
}
