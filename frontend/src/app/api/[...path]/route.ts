import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff/proxy';

type RouteContext = { params: Promise<{ path: string[] }> };

async function resolvePath(context: RouteContext): Promise<string[]> {
  const params = await context.params;
  return params.path ?? [];
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
