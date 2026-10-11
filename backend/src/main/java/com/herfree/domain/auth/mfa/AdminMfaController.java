package com.herfree.domain.auth.mfa;

import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/admin-mfa")
@RequiredArgsConstructor
public class AdminMfaController {
    private final AdminMfaService service;
    public record Proof(@NotBlank @Size(max=128) String code) {}
    public record Approval(@NotBlank @Size(max=128) String approvalCode) {}
    private long id(Authentication auth) { return ((Number) auth.getPrincipal()).longValue(); }
    private String access(String authorization) { return authorization.substring(7); }

    @GetMapping("/status")
    public ApiResponse<AdminMfaService.Status> status(Authentication auth,
            @RequestHeader("Authorization") String authorization,
            @RequestHeader(value="X-Herfree-Admin-MFA", required=false) String token) {
        return ApiResponse.success(service.status(id(auth), access(authorization), token));
    }
    @PostMapping("/enroll")
    public ApiResponse<AdminMfaService.Enrollment> enroll(Authentication auth, @Valid @RequestBody Approval request) {
        return ApiResponse.success(service.enroll(id(auth), request.approvalCode()));
    }
    @PostMapping("/confirm")
    public ApiResponse<AdminMfaService.Verification> confirm(Authentication auth, @Valid @RequestBody Proof request,
            @RequestHeader("Authorization") String authorization) {
        return ApiResponse.success(service.confirm(id(auth), request.code(), access(authorization)));
    }
    @PostMapping("/verify")
    public ApiResponse<AdminMfaService.Verification> verify(Authentication auth, @Valid @RequestBody Proof request,
            @RequestHeader("Authorization") String authorization) {
        return ApiResponse.success(service.verify(id(auth), request.code(), access(authorization)));
    }
    @PostMapping("/recover")
    public ApiResponse<AdminMfaService.Verification> recover(Authentication auth, @Valid @RequestBody Proof request,
            @RequestHeader("Authorization") String authorization) {
        return ApiResponse.success(service.recover(id(auth), request.code(), access(authorization)));
    }
    @PostMapping("/revoke")
    public ApiResponse<Void> revoke(Authentication auth) {
        service.revoke(id(auth));
        return ApiResponse.success(null);
    }
}
