package com.herfree.domain.user.service;
import com.herfree.domain.user.dto.response.CommunityDeletionRequestResponse;
import com.herfree.domain.user.entity.*;
import com.herfree.domain.user.repository.*;
import com.herfree.global.exception.*;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class CommunityDeletionRequestService {
    private final UserRepository users;
    private final CommunityDeletionRequestRepository requests;
    private final CommunityDeletionRequestItemRepository items;
    @Transactional(readOnly=true)
    public Page<CommunityDeletionRequestResponse> list(Long actorId, Pageable page) {
        requirePrivacyOperator(actorId);
        return requests.findAllByOrderByCreatedAtAscIdAsc(page).map(r -> CommunityDeletionRequestResponse.of(r,List.of()));
    }
    @Transactional(readOnly=true)
    public CommunityDeletionRequestResponse get(Long actorId, Long id) {
        requirePrivacyOperator(actorId);
        var r=requests.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return CommunityDeletionRequestResponse.of(r,items.findByRequestIdOrderByIdAsc(id));
    }
    @Transactional
    public CommunityDeletionRequestResponse acknowledge(Long actorId, Long id) {
        User actor=requirePrivacyOperator(actorId);
        var r=requests.findByIdForUpdate(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        r.acknowledge(actor,Instant.now());
        return CommunityDeletionRequestResponse.of(r,items.findByRequestIdOrderByIdAsc(id));
    }
    private User requirePrivacyOperator(Long actorId) {
        return users.findByIdAndStatus(actorId,UserStatus.ACTIVE)
                .filter(u -> u.getRole()==UserRole.ADMIN || u.getRole()==UserRole.SUPER_ADMIN)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN));
    }
}
