package com.herfree.domain.user.controller;
import com.herfree.domain.user.dto.request.UpdateCommunityHealthConsentRequest;
import com.herfree.domain.user.dto.response.CommunityHealthConsentResponse;
import com.herfree.domain.user.service.CommunityHealthConsentService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequiredArgsConstructor @RequestMapping("/api/users/me/consents/community-health")
public class CommunityHealthConsentController {
    private final CommunityHealthConsentService service;
    @GetMapping public ResponseEntity<ApiResponse<CommunityHealthConsentResponse>> get(@AuthenticationPrincipal Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(service.getConsent(id)));
    }
    @PatchMapping public ResponseEntity<ApiResponse<CommunityHealthConsentResponse>> update(@AuthenticationPrincipal Long id,
            @Valid @RequestBody UpdateCommunityHealthConsentRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(service.updateConsent(id,request.agreed(),request.policyVersion())));
    }
}
