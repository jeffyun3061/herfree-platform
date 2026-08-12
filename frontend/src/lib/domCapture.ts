import html2canvas from 'html2canvas';

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


function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('이미지 변환에 실패했습니다.'));
    reader.readAsDataURL(blob);
  });
}

async function inlineImageSources(clone: HTMLElement) {
  const images = Array.from(clone.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      const source = image.getAttribute('src');
      if (!source || source.startsWith('data:')) return;

      try {
        const response = await fetch(source, { credentials: 'same-origin' });
        if (!response.ok) return;
        image.setAttribute('src', await readBlobAsDataUrl(await response.blob()));
      } catch {
        // Keep the original source when the browser cannot fetch an asset.
      }
    }),
  );
}

async function cloneElementForCapture(element: HTMLElement): Promise<HTMLElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);

  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  await inlineImageSources(clone);
  return clone;
}

function showShareOnlyNodes(root: ParentNode) {
  root.querySelectorAll('[data-share-only]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.remove('hidden');
    node.classList.add('flex');
    node.style.removeProperty('display');
    node.style.display = 'flex';
  });
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

  const clone = await cloneElementForCapture(element);
  showShareOnlyNodes(clone);
  const measureRoot = document.createElement('div');
  measureRoot.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;visibility:hidden;pointer-events:none;`;
  measureRoot.appendChild(clone);
  document.body.appendChild(measureRoot);
  const cloneRect = clone.getBoundingClientRect();
  const captureHeight = Math.max(height, Math.ceil(cloneRect.height));
  measureRoot.remove();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${captureHeight}">
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
    canvas.height = captureHeight * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas를 사용할 수 없습니다.');
    }
    ctx.scale(pixelRatio, pixelRatio);
    ctx.drawImage(image, 0, 0, width, captureHeight);

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
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width <= 0 || height <= 0) {
    throw new Error('캡처할 영역이 비어 있습니다.');
  }

  await waitForImages(element);
  if (document.fonts?.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  }
  try {
    const canvas = await html2canvas(element, {
      allowTaint: false,
      backgroundColor: null,
      imageTimeout: 5000,
      logging: false,
      scale: pixelRatio,
      scrollX: 0,
      scrollY: 0,
      width,
      useCORS: true,
      windowHeight: Math.max(window.innerHeight, height),
      windowWidth: Math.max(window.innerWidth, width),
      x: 0,
      y: 0,
      onclone: (_clonedDocument, clonedElement) => {
        showShareOnlyNodes(clonedElement);
      },
    });
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('이미지 생성에 실패했습니다.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  } catch {
    // Keep the exact DOM layout when html2canvas cannot render a browser-specific CSS rule.
    return renderElementToBlob(element, pixelRatio);
  }
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
