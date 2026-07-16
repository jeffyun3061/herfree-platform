package com.herfree.domain.post.service;

import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostImageRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.PrivateBoardPolicy;
import com.herfree.global.util.StaffRolePolicy;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이미지 object 프록시 조회 권한.
 * 게시글 본문은 {@link PrivateBoardPolicy}로 마스킹되지만 이미지 URL은 key만 알면
 * 직접 호출할 수 있으므로, 서빙 시점에 첨부된 게시글의 공개 범위를 다시 판정한다.
 */
@Service
@RequiredArgsConstructor
public class PostImageAccessService {

    private final PostImageRepository postImageRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;

    /**
     * @param allowed      조회 허용 여부
     * @param privateScope true면 공용 캐시(CDN·프록시)에 저장되면 안 되는 이미지
     */
    public record ImageObjectAccess(boolean allowed, boolean privateScope) {
    }

    @Transactional(readOnly = true)
    public ImageObjectAccess check(String objectKey, Long viewerId) {
        UserRole viewerRole = resolveViewerRole(viewerId);
        boolean uploaderItself = viewerId != null && objectKey.startsWith("posts/" + viewerId + "/");

        List<Post> attachedPosts = postImageRepository.findAllByImageUrlEndingWith(objectKey).stream()
                .map(image -> image.getPost())
                .toList();
        List<Content> attachedContents = contentRepository.findAllByImageUrlEndingWith(objectKey);

        boolean referenced = !attachedPosts.isEmpty() || !attachedContents.isEmpty();
        boolean privateScope = false;

        for (Post post : attachedPosts) {
            boolean privateBoard = PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType());
            boolean membersOnly = post.getVisibility() == PostVisibility.MEMBERS_ONLY;
            boolean inactive = post.getStatus() != PostStatus.ACTIVE;

            if (privateBoard || membersOnly || inactive) {
                privateScope = true;
            }

            if (privateBoard && !PrivateBoardPolicy.canViewerReadPost(post, viewerId, viewerRole)) {
                return new ImageObjectAccess(false, true);
            }
            if (membersOnly && viewerId == null) {
                return new ImageObjectAccess(false, true);
            }
            if (inactive && !canReadInactivePost(post, viewerId, viewerRole)) {
                return new ImageObjectAccess(false, true);
            }
        }

        for (Content content : attachedContents) {
            if (content.getStatus() != ContentStatus.ACTIVE) {
                privateScope = true;
                boolean contentOwner = viewerId != null && content.getAuthor().getId().equals(viewerId);
                if (!contentOwner && !StaffRolePolicy.isStaff(viewerRole)) {
                    return new ImageObjectAccess(false, true);
                }
            }
        }

        if (referenced) {
            return new ImageObjectAccess(true, privateScope);
        }

        // 어디에도 첨부되지 않은 이미지(작성 중 미리보기)는 업로더 본인만 볼 수 있다.
        return new ImageObjectAccess(uploaderItself, true);
    }

    private boolean canReadInactivePost(Post post, Long viewerId, UserRole viewerRole) {
        if (viewerId == null) {
            return false;
        }
        if (StaffRolePolicy.isStaff(viewerRole)) {
            return true;
        }
        return post.getUser().getId().equals(viewerId);
    }

    private UserRole resolveViewerRole(Long viewerId) {
        if (viewerId == null) {
            return null;
        }
        return userRepository.findById(viewerId)
                .map(User::getRole)
                .orElse(UserRole.USER);
    }
}
