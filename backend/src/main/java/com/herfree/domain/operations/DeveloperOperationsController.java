package com.herfree.domain.operations;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/developer")
@RequiredArgsConstructor
public class DeveloperOperationsController {
    private final DeveloperOperationsService service;
    private final RequestDiagnostics diagnostics;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DeveloperOperationsService.Overview>> overview() {
        return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(ApiResponse.success(service.overview()));
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<RequestDiagnostics.Snapshot>> requests(
            @RequestParam(defaultValue = "true") boolean errorsOnly, @RequestParam(required = false) String requestId) {
        if (requestId != null && !requestId.matches("[A-Za-z0-9._-]{1,64}")) throw new BusinessException(ErrorCode.INVALID_INPUT);
        return ResponseEntity.ok().header("Cache-Control", "private, no-store")
                .body(ApiResponse.success(diagnostics.snapshot(errorsOnly, requestId)));
    }
}
