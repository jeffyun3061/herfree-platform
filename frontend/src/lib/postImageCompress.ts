import {
  POST_IMAGE_JPEG_QUALITY,
  buildOptimizedPostImageName,
  fitPostImageSize,
  shouldOptimizePostImage,
} from '@/domain/post/imagePolicy';

type ImageSource = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  close?: () => void;
};

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지 압축에 실패했습니다.'));
      },
      'image/jpeg',
      quality,
    );
  });
}

async function loadImageSource(file: File): Promise<ImageSource> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, width, height) => ctx.drawImage(bitmap, 0, 0, width, height),
      close: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      element.src = objectUrl;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (ctx, width, height) => ctx.drawImage(image, 0, 0, width, height),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * 커뮤니티 첨부용: 긴 변 제한 + JPEG 압축.
 * 최적화가 필요 없거나 결과가 더 커지면 원본을 그대로 반환한다.
 */
export async function preparePostImageForUpload(
  file: File,
  contentType: string,
): Promise<File> {
  let source: ImageSource;
  try {
    source = await loadImageSource(file);
  } catch {
    return file;
  }

  try {
    const fitted = fitPostImageSize(source.width, source.height);
    if (fitted.width <= 0 || fitted.height <= 0) {
      return file;
    }

    if (
      !shouldOptimizePostImage({
        width: source.width,
        height: source.height,
        byteSize: file.size,
        contentType,
      })
    ) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = fitted.width;
    canvas.height = fitted.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, fitted.width, fitted.height);
    source.draw(ctx, fitted.width, fitted.height);

    const blob = await canvasToJpegBlob(canvas, POST_IMAGE_JPEG_QUALITY);
    if (
      blob.size >= file.size
      && fitted.width === source.width
      && fitted.height === source.height
    ) {
      return file;
    }

    return new File([blob], buildOptimizedPostImageName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    source.close?.();
  }
}
