package com.herfree.domain.audit.controller;

import com.herfree.domain.audit.repository.AdminAuditLogRepository;
import com.herfree.domain.user.repository.RoleAuditLogRepository;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import com.herfree.global.response.ApiResponse;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAuditController {
    private final AdminAuditLogRepository actions;
    private final RoleAuditLogRepository changes;
    public record Action(long id, long actorId, String method, String path, int status, String requestId, Instant at) {}
    public record MemberChange(long id, long actorId, long targetUserId, String action,
            String previousRole, String newRole, String previousStatus, String newStatus, Instant at) {}
    public record Result<T>(List<T> content, boolean hasNext, int page) {}

    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<Result<Action>>> actions(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "7") int days, @RequestParam(required = false) Long actorId) {
        validate(page, days, actorId);
        var slice = actions.findActions(Instant.now().minusSeconds(days * 86400L), actorId, PageRequest.of(page, 20));
        return result(new Result<>(slice.getContent().stream().map(a -> new Action(a.getId(), a.getActorUserId(),
                a.getHttpMethod(), safePath(a.getRequestPath()), a.getResponseStatus(), a.getRequestId(), a.getCreatedAt())).toList(),
                slice.hasNext(), page));
    }

    @GetMapping("/members")
    public ResponseEntity<ApiResponse<Result<MemberChange>>> members(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "7") int days, @RequestParam(required = false) Long targetUserId) {
        validate(page, days, targetUserId);
        var slice = changes.findChanges(Instant.now().minusSeconds(days * 86400L), targetUserId, PageRequest.of(page, 20));
        return result(new Result<>(slice.getContent().stream().map(a -> new MemberChange(a.getId(), a.getActorId(),
                a.getTargetUserId(), a.getAction().name(), name(a.getPreviousRole()), name(a.getNewRole()),
                name(a.getPreviousStatus()), name(a.getNewStatus()), a.getCreatedAt())).toList(), slice.hasNext(), page));
    }

    private static String name(Enum<?> value) { return value == null ? null : value.name(); }
    private static void validate(int page, int days, Long id) {
        if (page < 0 || page > 100 || days < 1 || days > 30 || (id != null && id < 1))
            throw new BusinessException(ErrorCode.INVALID_INPUT);
    }
    private static String safePath(String path) {
        // Legacy stored paths may contain attacker-supplied segments. Only known resource paths are displayed.
        return path.matches("/api/(?:admin/(?:users|reports|posts|comments|contents|notices|videos|products)(?:/[0-9]+)?(?:/[a-z-]+)?|auth/admin-mfa/(?:enroll|confirm|verify|recover|revoke))")
                ? path : "관리 API";
    }
    private static <T> ResponseEntity<ApiResponse<T>> result(T value) {
        return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(ApiResponse.success(value));
    }
}
