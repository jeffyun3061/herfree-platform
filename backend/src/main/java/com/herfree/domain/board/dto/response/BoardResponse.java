package com.herfree.domain.board.dto.response;

import com.herfree.domain.board.entity.Board;

// 게시판 목록 응답 DTO — Entity를 직접 노출하지 않아 스키마 변경 시 API 계약이 깨지지 않는다
public record BoardResponse(
        Long id,
        String name,
        String description,
        String boardType
) {
    public static BoardResponse from(Board board) {
        return new BoardResponse(
                board.getId(),
                board.getName(),
                board.getDescription(),
                board.getBoardType()
        );
    }
}
