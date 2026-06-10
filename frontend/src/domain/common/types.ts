// 백엔드 공통 응답 래퍼 — ApiResponse.java의 {success, message, data} 형식과 동기화한다
export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

// Spring Data Page 직렬화 구조 — 백엔드가 Page<T>를 그대로 내려주므로
// number(0-based 페이지 번호)·totalPages 등 Spring 기본 필드명을 그대로 사용한다
export type PageData<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

// 목록이 비어 있을 때도 화면 코드가 안전하게 동작하도록 기본값을 제공한다
export function emptyPage<T>(): PageData<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 0,
    first: true,
    last: true,
  };
}
