package com.herfree.domain.board.controller;

import com.herfree.domain.board.dto.response.BoardResponse;
import com.herfree.domain.board.service.BoardService;
import com.herfree.global.response.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 게시판 목록 조회 API — 인증 없이 접근 가능한 공개 엔드포인트
// 앱 초기 로딩 시 전체 게시판 구조를 내려줘 클라이언트가 네비게이션을 구성할 수 있도록 한다
@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getBoards() {
        return ResponseEntity.ok(ApiResponse.success(boardService.getBoards()));
    }
}
