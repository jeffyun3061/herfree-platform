package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.exception.BoardNotFoundException;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.post.dto.request.NoticeCreateRequest;
import com.herfree.domain.post.dto.request.NoticeUpdateRequest;
import com.herfree.domain.post.dto.request.NoticeVisibilityRequest;
import com.herfree.domain.post.dto.response.AdminNoticeResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminNoticeService {

    private static final String NOTICE_BOARD_TYPE = "NOTICE";

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<AdminNoticeResponse> getNotices(Pageable pageable) {
        return postRepository
                .findByBoard_BoardTypeAndStatusInOrderByCreatedAtDesc(
                        NOTICE_BOARD_TYPE,
                        List.of(PostStatus.ACTIVE, PostStatus.HIDDEN),
                        pageable)
                .map(AdminNoticeResponse::from);
    }

    @Transactional
    public AdminNoticeResponse createNotice(Long adminId, NoticeCreateRequest request) {
        Board board = boardRepository.findByBoardType(NOTICE_BOARD_TYPE)
                .orElseThrow(BoardNotFoundException::new);
        User admin = userRepository.findById(adminId)
                .orElseThrow(UserNotFoundException::new);

        Post post = Post.builder()
                .board(board)
                .user(admin)
                .title(request.title().trim())
                .content(request.content().trim())
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();

        return AdminNoticeResponse.from(postRepository.save(post));
    }

    @Transactional
    public AdminNoticeResponse updateNotice(Long postId, NoticeUpdateRequest request) {
        Post post = findNoticeForAdmin(postId);
        post.update(request.title().trim(), request.content().trim(), false);
        return AdminNoticeResponse.from(post);
    }

    @Transactional
    public AdminNoticeResponse updateVisibility(Long postId, NoticeVisibilityRequest request) {
        Post post = findNoticeForAdmin(postId);
        if (Boolean.TRUE.equals(request.isVisible())) {
            post.restore();
        } else {
            post.hide();
        }
        return AdminNoticeResponse.from(post);
    }

    @Transactional
    public void deleteNotice(Long postId) {
        Post post = findNoticeForAdmin(postId);
        post.delete();
    }

    private Post findNoticeForAdmin(Long postId) {
        return postRepository
                .findByIdAndBoard_BoardTypeAndStatusNot(postId, NOTICE_BOARD_TYPE, PostStatus.DELETED)
                .orElseThrow(PostNotFoundException::new);
    }
}
