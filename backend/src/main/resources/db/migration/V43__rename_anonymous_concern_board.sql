UPDATE boards
SET name = '익명 고민',
    description = '질문 작성자는 익명입니다. 회원 누구나 익명 또는 닉네임 공개로 답변할 수 있으며, 글과 답변은 비회원도 읽을 수 있습니다.',
    updated_at = NOW(6)
WHERE board_type = 'ANONYMOUS_QUESTION';
