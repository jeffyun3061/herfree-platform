import { NextResponse } from 'next/server';

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ success: false, message, data: null }, { status });
}
