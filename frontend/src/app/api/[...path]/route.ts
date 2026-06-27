import { NextRequest, NextResponse } from 'next/server';

const API_TARGET = (
  process.env.API_REWRITE_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8080'
).replace(/\/$/, '');

// 프록시가 그대로 넘기면 안 되는 전송 계층 헤더들이다.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

/** 브라우저 → Next → Spring. Origin 제거로 모바일/ngrok CORS 403 방지 */
async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const targetUrl = `${API_TARGET}/api/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === 'origin' || lower === 'referer') {
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.arrayBuffer();
    } else {
      init.body = await request.text();
    }
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, init);
  } catch {
    return NextResponse.json(
      { success: false, message: '백엔드에 연결할 수 없습니다. API 서버 실행을 확인해 주세요.', data: null },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    responseHeaders.set(key, value);
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}
