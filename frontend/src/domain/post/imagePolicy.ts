/** 게시글 첨부 이미지 정책 — 업로드 전 클라이언트 최적화 기준 */

export const POST_IMAGE_MAX_LONG_EDGE = 1600;
export const POST_IMAGE_JPEG_QUALITY = 0.82;
/** 이 용량을 넘거나 긴 변이 제한을 넘으면 JPEG로 재인코딩한다 */
export const POST_IMAGE_REENCODE_MIN_BYTES = 800 * 1024;

export function fitPostImageSize(
  width: number,
  height: number,
  maxLongEdge: number = POST_IMAGE_MAX_LONG_EDGE,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function shouldOptimizePostImage(input: {
  width: number;
  height: number;
  byteSize: number;
  contentType: string;
  maxLongEdge?: number;
}): boolean {
  const maxLongEdge = input.maxLongEdge ?? POST_IMAGE_MAX_LONG_EDGE;
  const fitted = fitPostImageSize(input.width, input.height, maxLongEdge);
  const needsResize = fitted.width < input.width || fitted.height < input.height;
  if (needsResize) return true;
  if (input.byteSize >= POST_IMAGE_REENCODE_MIN_BYTES) return true;
  // PNG/WEBP는 피드용 JPEG로 통일해 용량을 줄인다 (투명도는 커뮤니티 사진에서 불필요)
  return input.contentType === 'image/png' || input.contentType === 'image/webp';
}

export function buildOptimizedPostImageName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '').trim() || 'post-image';
  return `${base}.jpg`;
}
