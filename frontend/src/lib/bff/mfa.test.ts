import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { createMfaSessionResponse, clearSessionCookies } from './session';
import { buildBackendRequestHeaders } from './headers';
import { NextResponse } from 'next/server';

const config = { production: true, accessCookie: '__Host-herfree-access', csrfCookie: '__Host-herfree-csrf' };

describe('administrator MFA BFF boundary', () => {
  it('removes the MFA token from JSON and writes a secure 15-minute HttpOnly cookie', async () => {
    const token = 'a'.repeat(43);
    const response = await createMfaSessionResponse(Response.json({ success: true, data: { mfaToken: token, recoveryCodes: ['save-once'] } }), 'auth/admin-mfa/confirm', config);
    expect(response).not.toBeNull();
    expect(await response!.json()).toEqual({ success: true, data: { recoveryCodes: ['save-once'] } });
    const cookie = response!.cookies.get('__Host-herfree-admin-mfa');
    expect(cookie).toMatchObject({ value: token, httpOnly: true, secure: true, sameSite: 'strict', maxAge: 900, path: '/' });
    expect(response!.headers.get('cache-control')).toBe('private, no-store');
  });

  it('never forwards an attacker supplied MFA header', () => {
    const request = new NextRequest('https://herpfree.co.kr/api/admin/users', { headers: { 'X-Herfree-Admin-MFA': 'forged', authorization: 'Bearer forged' } });
    expect(buildBackendRequestHeaders(request).get('X-Herfree-Admin-MFA')).toBeNull();
    expect(buildBackendRequestHeaders(request, 'access', 'cookie-token').get('X-Herfree-Admin-MFA')).toBe('cookie-token');
  });

  it('clears MFA alongside logout, account deletion and password changes', () => {
    const response = NextResponse.json({});
    clearSessionCookies(response, config);
    expect(response.cookies.get('__Host-herfree-admin-mfa')?.maxAge).toBe(0);
  });
});
