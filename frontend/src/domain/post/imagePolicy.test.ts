import { describe, expect, it } from 'vitest';
import {
  POST_IMAGE_MAX_LONG_EDGE,
  POST_IMAGE_REENCODE_MIN_BYTES,
  buildOptimizedPostImageName,
  fitPostImageSize,
  shouldOptimizePostImage,
} from '@/domain/post/imagePolicy';

describe('post imagePolicy', () => {
  it('keeps dimensions when already within the long-edge limit', () => {
    expect(fitPostImageSize(1200, 800)).toEqual({ width: 1200, height: 800 });
  });

  it('scales down by the longer edge', () => {
    expect(fitPostImageSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitPostImageSize(3000, 4000)).toEqual({ width: 1200, height: 1600 });
    expect(fitPostImageSize(4000, 3000, 800)).toEqual({ width: 800, height: 600 });
  });

  it('rejects non-positive dimensions', () => {
    expect(fitPostImageSize(0, 100)).toEqual({ width: 0, height: 0 });
    expect(fitPostImageSize(-1, 100)).toEqual({ width: 0, height: 0 });
  });

  it('optimizes oversized, heavy, or non-jpeg sources', () => {
    expect(
      shouldOptimizePostImage({
        width: 4000,
        height: 3000,
        byteSize: 100_000,
        contentType: 'image/jpeg',
      }),
    ).toBe(true);

    expect(
      shouldOptimizePostImage({
        width: 800,
        height: 600,
        byteSize: POST_IMAGE_REENCODE_MIN_BYTES,
        contentType: 'image/jpeg',
      }),
    ).toBe(true);

    expect(
      shouldOptimizePostImage({
        width: 800,
        height: 600,
        byteSize: 100_000,
        contentType: 'image/png',
      }),
    ).toBe(true);

    expect(
      shouldOptimizePostImage({
        width: 800,
        height: 600,
        byteSize: 100_000,
        contentType: 'image/jpeg',
        maxLongEdge: POST_IMAGE_MAX_LONG_EDGE,
      }),
    ).toBe(false);
  });

  it('normalizes optimized filenames to jpg', () => {
    expect(buildOptimizedPostImageName('photo.PNG')).toBe('photo.jpg');
    expect(buildOptimizedPostImageName('no-ext')).toBe('no-ext.jpg');
  });
});
