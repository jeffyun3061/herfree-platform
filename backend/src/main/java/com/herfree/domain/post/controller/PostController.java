package com.herfree.domain.post.controller;

import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.dto.request.PostImageUploadUrlRequest;
import com.herfree.domain.post.dto.request.PostUpdateRequest;
import com.herfree.domain.post.dto.response.PostDetailResponse;
import com.herfree.domain.post.dto.response.PostImageUploadResponse;
import com.herfree.domain.post.dto.response.PostImageUploadUrlResponse;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.service.PostService;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import com.herfree.global.response.ApiResponse;
import com.herfree.global.storage.PostImageStorageService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import java.time.Duration;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PostImageStorageService postImageStorageService;

    // boardId를 쿼리 파라미터로 받는 이유:
    // 특정 게시판 필터링은 리소스 계층 구조가 아닌 조회 조건이므로 쿼리스트링이 적합하다
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPosts(
            @RequestParam(required = false) Long boardId,
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPosts(boardId, keyword, pageable, userId)));
    }

    @PostMapping(value = "/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PostImageUploadResponse>> uploadImage(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        String contentType = postImageStorageService.resolveContentType(
                file.getContentType(), file.getOriginalFilename());
        String imageUrl = postImageStorageService.uploadImage(userId, file.getBytes(), contentType);
        return ResponseEntity.ok(ApiResponse.success(new PostImageUploadResponse(imageUrl)));
    }

    @GetMapping("/images/object/**")
    public ResponseEntity<byte[]> serveImage(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String prefix = PostImageStorageService.IMAGE_OBJECT_PATH_PREFIX;
        if (!uri.startsWith(prefix)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_URL);
        }
        String objectKey = uri.substring(prefix.length());
        PostImageStorageService.ImageObjectPayload payload = postImageStorageService.fetchImageObject(objectKey);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                .header("Content-Type", payload.contentType())
                .body(payload.bytes());
    }

    @PostMapping("/images/upload-url")
    public ResponseEntity<ApiResponse<PostImageUploadUrlResponse>> createImageUploadUrl(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PostImageUploadUrlRequest request
    ) {
        PostImageUploadUrlResponse response = postImageStorageService.createUploadUrl(
                userId, request.contentType(), request.contentLength());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostDetailResponse>> createPost(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PostCreateRequest request
    ) {
        PostDetailResponse response = postService.createPost(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // 비로그인 사용자도 공개 게시글을 조회할 수 있으므로 @AuthenticationPrincipal이 null일 수 있다
    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPost(postId, userId)));
    }

    @PatchMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> updatePost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.updatePost(userId, postId, request)));
    }

    // 204 No Content — soft delete이므로 응답 바디가 없다
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId
    ) {
        postService.deletePost(userId, postId);
        return ResponseEntity.noContent().build();
    }
}
