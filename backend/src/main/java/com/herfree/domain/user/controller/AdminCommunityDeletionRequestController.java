package com.herfree.domain.user.controller;
import com.herfree.domain.user.dto.response.CommunityDeletionRequestResponse;
import com.herfree.domain.user.service.CommunityDeletionRequestService;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequiredArgsConstructor @RequestMapping("/api/admin/community-deletion-requests")
public class AdminCommunityDeletionRequestController {
    private final CommunityDeletionRequestService service;
    @GetMapping public ResponseEntity<ApiResponse<Page<CommunityDeletionRequestResponse>>> list(@AuthenticationPrincipal Long actor,
            @PageableDefault(size=20) Pageable page) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(service.list(actor,page)));
    }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<CommunityDeletionRequestResponse>> get(@AuthenticationPrincipal Long actor,@PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(service.get(actor,id)));
    }
    @PatchMapping("/{id}/acknowledge") public ResponseEntity<ApiResponse<CommunityDeletionRequestResponse>> acknowledge(@AuthenticationPrincipal Long actor,@PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(service.acknowledge(actor,id)));
    }
}
