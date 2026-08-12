function inlineComputedStyles(source: HTMLElement, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  let cssText = '';
  for (let index = 0; index < computed.length; index += 1) {
    const prop = computed.item(index);
    const value = computed.getPropertyValue(prop);
    if (value) {
      cssText += `${prop}:${value};`;
    }
  }
  target.setAttribute('style', cssText);

  if (source instanceof HTMLImageElement && target instanceof HTMLImageElement) {
    const sourceUrl = source.currentSrc || source.src;
    if (sourceUrl) {
      target.src = new URL(sourceUrl, document.baseURI).href;
    }
  }

  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const targetChildren = Array.from(target.children) as HTMLElement[];
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) {
      inlineComputedStyles(child, targetChild);
    }
  });
}


function cloneElementForCapture(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);

  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  return clone;
}

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete) return;
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 5000);
        const finish = () => {
          window.clearTimeout(timeout);
          resolve();
        };
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
      });
    }),
  );
}

async function renderElementToBlob(element: HTMLElement, pixelRatio = 2): Promise<Blob> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (width === 0 || height === 0) {
    throw new Error('캡처할 영역이 비어 있습니다.');
  }

  const clone = cloneElementForCapture(element);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${new XMLSerializer().serializeToString(clone)}
      </foreignObject>
    </svg>`;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas를 사용할 수 없습니다.');
    }
    ctx.scale(pixelRatio, pixelRatio);
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), 'image/png'),
    );
    if (!blob) {
      throw new Error('이미지 생성에 실패했습니다.');
    }
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function captureElementPngBlob(
  element: HTMLElement,
  pixelRatio = 2,
): Promise<Blob> {
  await waitForImages(element);
  if (document.fonts?.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  }
  return renderElementToBlob(element, pixelRatio);
}

export async function downloadElementPng(element: HTMLElement, filename: string): Promise<void> {
  const blob = await renderElementToBlob(element);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error('이미지 로드 시간이 초과되었습니다.')), 5000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('이미지 로드에 실패했습니다.'));
    };
    image.src = url;
  });
}

export function printElement(element: HTMLElement, title: string) {
  const printRoot = document.createElement('div');
  printRoot.id = 'journal-print-root';
  printRoot.setAttribute('data-print-title', title);
  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add('journal-print-clone');
  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);

  const cleanup = () => {
    printRoot.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}
