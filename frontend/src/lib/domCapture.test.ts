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
    card.innerHTML = `
      <p data-share-text="1" style="height:18px;white-space:nowrap;overflow:hidden;-webkit-line-clamp:1">
        마지막 증상 이후 1일째 · 수면 -h · 스트레스 보통
      </p>
      <div data-share-text="1" style="height:16px;white-space:nowrap;overflow:hidden">
        개인일지 요약 · 최근 90일
      </div>
      <div class="content" style="height:380px;overflow:hidden">
        <div data-share-only="1" class="hidden" style="display:none;height:0px">
          <span>헤르프리 개인일지</span>
          <a href="https://herpfree.co.kr">herpfree.co.kr</a>
        </div>
      </div>`;
    document.body.appendChild(card);

    let capturedElement: HTMLElement | null = null;
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function getBoundingClientRect() {
        if (this === card) return rect(320, 380);
        if (this.id === 'hf-dashboard-card') {
          const footer = this.querySelector('[data-share-only]');
          const content = this.querySelector('.content');
          const footerIsInFlow =
            footer instanceof HTMLElement &&
            footer.style.display === 'flex' &&
            footer.style.height === 'auto';
          const contentIsNaturalHeight = content instanceof HTMLElement && content.style.height === 'auto';
          return rect(320, footerIsInFlow && contentIsNaturalHeight ? 420 : 380);
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
      const capturedFooter = capturedElement?.querySelector('[data-share-only]');
      expect(capturedFooter?.getAttribute('style')).toContain('display: flex');
      expect(capturedFooter instanceof HTMLElement && capturedFooter.style.height).toBe('auto');
      expect(capturedFooter?.textContent).toContain('헤르프리 개인일지');
      expect(capturedFooter?.textContent).toContain('herpfree.co.kr');
      expect(capturedElement?.querySelector('.content')?.getAttribute('style')).toContain('height: auto');
      const capturedShareText = capturedElement?.querySelectorAll('[data-share-text]');
      expect(capturedShareText).toHaveLength(2);
      capturedShareText?.forEach((node) => {
        expect(node.getAttribute('style')).toContain('height: auto');
        expect(node.getAttribute('style')).toContain('white-space: normal');
        expect(node.getAttribute('style')).toContain('overflow: visible');
        expect(node.getAttribute('style')).not.toContain('-webkit-line-clamp');
      });
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
