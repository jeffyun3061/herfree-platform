const CAPTURE_PROPS = [
  'color',
  'background-color',
  'font-size',
  'font-family',
  'font-weight',
  'padding',
  'margin',
  'border',
  'border-radius',
  'width',
  'height',
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'text-align',
  'line-height',
  'box-shadow',
] as const;

function inlineComputedStyles(source: HTMLElement, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  let cssText = '';
  for (const prop of CAPTURE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (value) {
      cssText += `${prop}:${value};`;
    }
  }
  target.setAttribute('style', cssText);

  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const targetChildren = Array.from(target.children) as HTMLElement[];
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) {
      inlineComputedStyles(child, targetChild);
    }
  });
}

export async function downloadElementPng(element: HTMLElement, filename: string): Promise<void> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (width === 0 || height === 0) {
    throw new Error('캡처할 영역이 비어 있습니다.');
  }

  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

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
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas를 사용할 수 없습니다.');
    }
    ctx.scale(2, 2);
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), 'image/png'),
    );
    if (!blob) {
      throw new Error('이미지 생성에 실패했습니다.');
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
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
