package com.herfree.domain.user.service;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.dto.response.CommunityHealthConsentResponse;
import com.herfree.domain.user.entity.*;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.*;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Public community consent is intentionally independent of personal-journal consent. */
@Service @RequiredArgsConstructor
public class CommunityHealthConsentService {
    public static final String POLICY_VERSION = "2026-10-27";
    public static final String PURPOSE = "ANONYMOUS_CONCERN_PUBLICATION";
    private final UserRepository users;
    private final CommunityHealthConsentRepository consents;
    private final CommunityDeletionRequestRepository requests;
    private final CommunityDeletionRequestItemRepository items;
    private final PostRepository posts;
    private final CommentRepository comments;

    @Transactional(readOnly = true)
    public CommunityHealthConsentResponse getConsent(Long userId) {
        users.findByIdAndStatus(userId, UserStatus.ACTIVE).orElseThrow(UserNotFoundException::new);
        return response(userId, consents.findFirstByUserIdOrderByIdDesc(userId).orElse(null));
    }

    /** Call before locking/writing a post. The user lock serializes writing and withdrawal. */
    @Transactional
    public CommunityHealthConsent requireGrantForWriting(Long userId) {
        lockUser(userId);
        // Locking reads see the latest committed decision even when an outer
        // MySQL REPEATABLE READ transaction already read the board beforehand.
        return consents.findTopByUserIdOrderByIdDesc(userId).filter(this::isCurrentGrant)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMUNITY_HEALTH_CONSENT_REQUIRED));
    }

    @Transactional
    public CommunityHealthConsentResponse updateConsent(Long userId, boolean agreed, String acceptedVersion) {
        User user = lockUser(userId);
        if (agreed && !POLICY_VERSION.equals(acceptedVersion))
            throw new BusinessException(ErrorCode.COMMUNITY_HEALTH_CONSENT_VERSION_CHANGED);
        CommunityHealthConsent current = consents.findTopByUserIdOrderByIdDesc(userId).orElse(null);
        if (current != null && ((!agreed && !current.isAgreed()) || (agreed && isCurrentGrant(current))))
            return response(userId, current);
        CommunityHealthConsent decision = consents.save(new CommunityHealthConsent(user, agreed, POLICY_VERSION, PURPOSE, Instant.now()));
        if (!agreed) withdraw(user, decision, current != null && current.isAgreed());
        return response(userId, decision);
    }

    private void withdraw(User user, CommunityHealthConsent withdrawal, boolean wasGranted) {
        // All own writes hold this user's lock. Lock the union of affected parent
        // posts globally in ID order before touching any comment/counter.
        Set<Long> ownedPostIds = new HashSet<>(posts.findConsentBackedIdsForWithdrawal(user.getId()));
        var targets = comments.findConsentBackedTargetsForWithdrawal(user.getId());
        Set<Long> parentIds = new TreeSet<>(ownedPostIds);
        targets.forEach(c -> parentIds.add(c.getPostId()));
        Map<Long, Post> lockedPosts = parentIds.isEmpty() ? Map.of() : posts.lockAllByIdIn(parentIds).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));
        List<Comment> lockedComments = targets.isEmpty() ? List.of() : comments.lockAllByIdIn(
                targets.stream().map(CommentRepository.WithdrawalTarget::getId).sorted().toList());
        List<Post> ownedPosts = ownedPostIds.stream().sorted().map(lockedPosts::get).filter(Objects::nonNull).toList();
        // Defense in depth: no caller-supplied target IDs or other authors' rows.
        if (ownedPosts.stream().anyMatch(p -> !p.getUser().getId().equals(user.getId()) || p.getCommunityHealthConsent() == null)
                || lockedComments.stream().anyMatch(c -> !c.getUser().getId().equals(user.getId()) || c.getCommunityHealthConsent() == null))
            throw new BusinessException(ErrorCode.FORBIDDEN);
        if (ownedPosts.isEmpty() && lockedComments.isEmpty() && !wasGranted) return;
        CommunityDeletionRequest request = requests.save(new CommunityDeletionRequest(user, withdrawal, ownedPosts.size(), lockedComments.size()));
        List<CommunityDeletionRequestItem> receipt = new ArrayList<>();
        for (Post post : ownedPosts) {
            post.withdrawCommunityHealthConsent();
            receipt.add(new CommunityDeletionRequestItem(request, CommunityDeletionRequestItem.TargetType.POST, post.getId(), post.getCommunityHealthConsent()));
        }
        Map<Long,Integer> removed = new HashMap<>();
        for (Comment comment : lockedComments) {
            if (comment.getStatus() == CommentStatus.ACTIVE) removed.merge(comment.getPost().getId(),1,Integer::sum);
            comment.withdrawCommunityHealthConsent();
            receipt.add(new CommunityDeletionRequestItem(request, CommunityDeletionRequestItem.TargetType.COMMENT, comment.getId(), comment.getCommunityHealthConsent()));
        }
        removed.forEach((id,count) -> lockedPosts.get(id).removeActiveComments(count));
        items.saveAll(receipt);
    }

    private User lockUser(Long userId) {
        return users.findByIdAndStatusForUpdate(userId, UserStatus.ACTIVE).orElseThrow(UserNotFoundException::new);
    }
    private boolean isCurrentGrant(CommunityHealthConsent c) {
        return c.isAgreed() && POLICY_VERSION.equals(c.getPolicyVersion()) && PURPOSE.equals(c.getPurpose());
    }
    private CommunityHealthConsentResponse response(Long userId, CommunityHealthConsent c) {
        Long requestId = requests.findFirstByUserIdOrderByIdDesc(userId).map(CommunityDeletionRequest::getId).orElse(null);
        return new CommunityHealthConsentResponse(c != null && isCurrentGrant(c), c == null ? null : c.isAgreed(), POLICY_VERSION,
                c == null ? null : c.getPolicyVersion(), PURPOSE, c == null ? null : c.getDecidedAt(), requestId);
    }
}
