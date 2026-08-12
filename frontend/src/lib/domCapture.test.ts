import { afterEach, describe, expect, it, vi } from 'vitest';

const html2canvasMock = vi.hoisted(() => vi.fn());

vi.mock('html2canvas', () => ({ default: html2canvasMock }));

import { captureElementPngBlob } from '@/lib/domCapture';

function rect(width: number, height: number): DOMRect {
  return {
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('captureElementPngBlob', () => {
  afterEach(() => {
    html2canvasMock.mockReset();
    document.body.innerHTML = '';
  });

  it('measures the share-only footer before choosing the canvas height', async () => {
    const card = document.createElement('section');
    card.id = 'hf-dashboard-card';
    card.style.height = '380px';
    card.innerHTML = '<div data-share-only="1" class="hidden">footer</div>';
    document.body.appendChild(card);

    let capturedElement: HTMLElement | null = null;
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function getBoundingClientRect() {
        if (this === card) return rect(320, 380);
        if (this.id === 'hf-dashboard-card') {
          const footer = this.querySelector('[data-share-only]');
          return rect(320, footer instanceof HTMLElement && footer.style.display === 'flex' ? 420 : 380);
        }
        return originalGetBoundingClientRect.call(this);
      },
    });

    html2canvasMock.mockImplementation(async (element: HTMLElement) => {
      capturedElement = element;
      return {
        toBlob(callback: (blob: Blob) => void) {
          callback(new Blob(['png'], { type: 'image/png' }));
        },
      } as unknown as HTMLCanvasElement;
    });

    try {
      const result = await captureElementPngBlob(card, 2);

      expect(result.type).toBe('image/png');
      expect(html2canvasMock).toHaveBeenCalledTimes(1);
      expect(capturedElement).not.toBe(card);
      expect(capturedElement?.style.height).toBe('auto');
      expect(capturedElement?.querySelector('[data-share-only]')?.getAttribute('style')).toContain('display: flex');
      expect(html2canvasMock.mock.calls[0]?.[1]).toMatchObject({
        height: 420,
        width: 320,
      });
      expect(card.style.height).toBe('380px');
      expect(capturedElement && document.body.contains(capturedElement)).toBe(false);
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: originalGetBoundingClientRect,
      });
    }
  });
});
