package com.herfree.domain.board.repository;

import com.herfree.domain.board.entity.Board;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 활성화된 게시판만 sort_order 오름차순으로 조회한다
    // 비활성 게시판을 숨기는 로직을 Repository 수준에서 처리해 Service 코드가 단순해진다
    List<Board> findAllByIsActiveTrueOrderBySortOrderAsc();

    java.util.Optional<Board> findByBoardType(String boardType);
}
