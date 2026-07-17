package com.herfree.domain.board.service;

import com.herfree.domain.board.dto.response.BoardResponse;
import com.herfree.domain.board.repository.BoardRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 활성 게시판 메타 목록 — 타입·정렬·라벨은 DB 시드 + Flyway로 관리.
 * <p>
 * 게시판별 작성·조회 정책은 {@link com.herfree.global.util.BoardWritePolicy}·{@link com.herfree.global.util.PrivateBoardPolicy}.
 */
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
