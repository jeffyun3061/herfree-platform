package com.herfree.global.util;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.user.entity.UserRole;

public final class PrivateBoardPolicy {

    public static final String MASKED_TITLE = "******";

    public static final String SECRET_STORY_DETAIL_MESSAGE = "비밀 사연 입니다.";

    private PrivateBoardPolicy() {
    }

    public static boolean isInquiryBoard(String boardType) {
        return "INQUIRY".equals(boardType);
    }

    public static boolean isSecretConsultBoard(String boardType) {
        return "PRIVATE_CONSULT".equals(boardType);
    }

    public static boolean isSecretStoryBoard(String boardType) {
        return "SECRET_STORY".equals(boardType);
    }

    /** 커뮤니티 탭·통합 피드에서 제외 — 푸터·Quick Access 전용 */
    public static boolean isOffCommunityBoard(String boardType) {
        return isInquiryBoard(boardType) || isSecretConsultBoard(boardType);
    }

    /** @deprecated use {@link #isOffCommunityBoard} */
    @Deprecated
    public static boolean isPrivateBoard(String boardType) {
        return isOffCommunityBoard(boardType);
    }

    /** 제목 마스킹·운영자 전용 답글 정책 대상 (비밀사연 포함) */
    public static boolean isAdminMaskedBoard(String boardType) {
        return isOffCommunityBoard(boardType) || isSecretStoryBoard(boardType);
    }

    public static boolean canViewerReadPost(Post post, Long viewerId, UserRole viewerRole) {
        String boardType = post.getBoard().getBoardType();

        if (isSecretStoryBoard(boardType)) {
            return viewerId != null && StaffRolePolicy.isStaff(viewerRole);
        }

        if (!isAdminMaskedBoard(boardType)) {
            return true;
        }

        if (viewerId == null) {
            return false;
        }

        if (StaffRolePolicy.isStaff(viewerRole)) {
            return true;
        }

        return post.getUser().getId().equals(viewerId);
    }

    public static boolean shouldMaskInList(Post post, Long viewerId, UserRole viewerRole) {
        if (!isAdminMaskedBoard(post.getBoard().getBoardType())) {
            return false;
        }

        return !canViewerReadPost(post, viewerId, viewerRole);
    }

    public static boolean canViewerReadComments(Post post, Long viewerId, UserRole viewerRole) {
        if (!isAdminMaskedBoard(post.getBoard().getBoardType())) {
            return true;
        }

        return canViewerReadPost(post, viewerId, viewerRole);
    }

    public static boolean canStaffWriteCommentOnPrivateBoard(UserRole viewerRole) {
        return StaffRolePolicy.isStaff(viewerRole);
    }
}
