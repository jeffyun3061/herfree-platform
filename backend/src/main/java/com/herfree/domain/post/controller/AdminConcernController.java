package com.herfree.domain.post.controller;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/concerns")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminConcernController {
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getConcerns(
            @RequestParam(defaultValue = "false") String answered,
            @RequestParam(defaultValue = "0") String page) {
        if (!(answered.equals("true") || answered.equals("false")) || !page.matches("\\d{1,5}")
                || Integer.parseInt(page) > 10000) {
            throw new com.herfree.global.exception.BusinessException(com.herfree.global.exception.ErrorCode.INVALID_INPUT);
        }
        var posts = postRepository.findAnonymousConcerns(Boolean.parseBoolean(answered), PageRequest.of(Integer.parseInt(page), 20));
        var replied = posts.isEmpty() ? java.util.Set.<Long>of() : commentRepository.findPostIdsWithStaffReplies(
                posts.getContent().stream().map(p -> p.getId()).toList(), CommentStatus.ACTIVE);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(posts.map(post ->
                PostResponse.of(post, "익명", null, null, replied.contains(post.getId())))));
    }
}
