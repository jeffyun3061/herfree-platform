package com.herfree.global.util;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.user.entity.UserRole;

public final class PrivateBoardPolicy {

    public static final String MASKED_TITLE = "***************";

    private PrivateBoardPolicy() {
    }

    public static boolean isInquiryBoard(String boardType) {
        return "INQUIRY".equals(boardType);
    }

    public static boolean isSecretConsultBoard(String boardType) {
        return "PRIVATE_CONSULT".equals(boardType);
    }

    public static boolean isPrivateBoard(String boardType) {
        return isInquiryBoard(boardType) || isSecretConsultBoard(boardType);
    }

    public static boolean canViewerReadPost(Post post, Long viewerId, UserRole viewerRole) {
        if (!isPrivateBoard(post.getBoard().getBoardType())) {
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
        if (!isPrivateBoard(post.getBoard().getBoardType())) {
            return false;
        }
        return !canViewerReadPost(post, viewerId, viewerRole);
    }

    /** 비공개 게시판 댓글 열람 — 작성자(운영자 답변 확인) 또는 운영자 */
    public static boolean canViewerReadComments(Post post, Long viewerId, UserRole viewerRole) {
        if (!isPrivateBoard(post.getBoard().getBoardType())) {
            return true;
        }
        return canViewerReadPost(post, viewerId, viewerRole);
    }

    /** 비공개 게시판 댓글·답글 작성 — 운영자만 */
    public static boolean canStaffWriteCommentOnPrivateBoard(UserRole viewerRole) {
        return StaffRolePolicy.isStaff(viewerRole);
    }
}
