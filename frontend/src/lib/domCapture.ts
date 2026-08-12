import html2canvas from 'html2canvas';

function inlineComputedStyles(source: HTMLElement, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  let cssText = '';
  for (let index = 0; index < computed.length; index += 1) {
    const prop = computed.item(index);
    const value = computed.getPropertyValue(prop);
    if (value) cssText += `${prop}:${value};`;
  }
  target.setAttribute('style', cssText);

  if (source instanceof HTMLImageElement && target instanceof HTMLImageElement) {
    const sourceUrl = source.currentSrc || source.src;
    if (sourceUrl) target.src = new URL(sourceUrl, document.baseURI).href;
  }

  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const targetChildren = Array.from(target.children) as HTMLElement[];
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) inlineComputedStyles(child, targetChild);
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
        if (response.ok) image.setAttribute('src', await readBlobAsDataUrl(await response.blob()));
      } catch {
        // html2canvas can still use the original URL when the asset is same-origin.
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

type PreparedCapture = {
  host: HTMLDivElement;
  clone: HTMLElement;
  width: number;
  height: number;
};

async function prepareCapture(element: HTMLElement): Promise<PreparedCapture> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  if (width <= 0 || Math.ceil(rect.height) <= 0) {
    throw new Error('캡처할 영역이 비어 있습니다.');
  }

  const clone = await cloneElementForCapture(element);
  showShareOnlyNodes(clone);

  // The live card has a natural height. Reset the copied used height before
  // adding share-only content, otherwise the clone keeps the old cropped box.
  clone.style.display = 'block';
  clone.style.width = `${width}px`;
  clone.style.height = 'auto';
  clone.style.minHeight = '0';
  clone.style.maxHeight = 'none';

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;overflow:visible;pointer-events:none;`;
  host.appendChild(clone);
  document.body.appendChild(host);
  await waitForImages(clone);

  const height = Math.ceil(clone.getBoundingClientRect().height);
  if (height <= 0) {
    host.remove();
    throw new Error('캡처할 영역이 비어 있습니다.');
  }
  return { host, clone, width, height };
}

function cleanupCapture(prepared: PreparedCapture) {
  prepared.host.remove();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('이미지 생성에 실패했습니다.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

async function renderPreparedCloneToBlob(
  prepared: PreparedCapture,
  pixelRatio: number,
): Promise<Blob> {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${prepared.width}" height="${prepared.height}">
      <foreignObject width="100%" height="100%">
        ${new XMLSerializer().serializeToString(prepared.clone)}
      </foreignObject>
    </svg>`;
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = prepared.width * pixelRatio;
    canvas.height = prepared.height * pixelRatio;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas를 사용할 수 없습니다.');
    context.scale(pixelRatio, pixelRatio);
    context.drawImage(image, 0, 0, prepared.width, prepared.height);
    return canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function captureElementPngBlob(
  element: HTMLElement,
  pixelRatio = 2,
): Promise<Blob> {
  if (document.fonts?.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  }

  const prepared = await prepareCapture(element);
  try {
    try {
      const canvas = await html2canvas(prepared.clone, {
        allowTaint: false,
        backgroundColor: null,
        height: prepared.height,
        imageTimeout: 5000,
        logging: false,
        scale: pixelRatio,
        scrollX: 0,
        scrollY: 0,
        width: prepared.width,
        useCORS: true,
        windowHeight: Math.max(window.innerHeight, prepared.height),
        windowWidth: Math.max(window.innerWidth, prepared.width),
        x: 0,
        y: 0,
      });
      return canvasToBlob(canvas);
    } catch {
      // Keep the same measured clone when html2canvas cannot render a CSS rule.
      return renderPreparedCloneToBlob(prepared, pixelRatio);
    }
  } finally {
    cleanupCapture(prepared);
  }
}

export async function downloadElementPng(element: HTMLElement, filename: string): Promise<void> {
  const blob = await captureElementPngBlob(element);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
