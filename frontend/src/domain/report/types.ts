// 백엔드 ReportTargetType·ReportStatus enum과 동기화
export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';
export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type ReportCreateInput = {
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  detail?: string;
};

// 관리자 신고 목록 항목 (ReportResponse)
export type Report = {
  id: number;
  reporterId: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  processedById: number | null;
  processedAt: string | null;
  createdAt: string;
};

export type ReportProcessInput = {
  status: 'ACCEPTED' | 'REJECTED';
  processNote?: string;
};

// 운영 정책(requirements.md §14)에 맞춘 신고 사유 선택지 — 서버는 자유 문자열(100자)을 받는다
export const REPORT_REASONS: string[] = [
  '욕설/비방/혐오 표현',
  '허위 의료 정보',
  '과도한 불안 조장',
  '개인정보 노출',
  '스팸/광고',
  '기타',
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '승인됨',
  REJECTED: '반려됨',
};

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  POST: '게시글',
  COMMENT: '댓글',
  USER: '사용자',
};
