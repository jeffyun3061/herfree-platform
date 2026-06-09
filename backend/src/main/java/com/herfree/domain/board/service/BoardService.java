package com.herfree.domain.board.service;

import com.herfree.domain.board.dto.response.BoardResponse;
import com.herfree.domain.board.repository.BoardRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;

    // 게시판 목록은 변경 빈도가 낮아 readOnly 트랜잭션으로 조회 성능을 높인다
    @Transactional(readOnly = true)
    public List<BoardResponse> getBoards() {
        return boardRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(BoardResponse::from)
                .toList();
    }
}
