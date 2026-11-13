import { expect, test, type Page } from '@playwright/test';

async function fixture(page: Page, role: string, stale = false, verified = true) {
  const calls: string[] = [];
  const now = new Date().toISOString();
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url()); calls.push(url.pathname + url.search);
    const data = url.pathname === '/api/users/me' ? { id: 7, nickname: '진단 계정', role }
      : url.pathname === '/api/auth/admin-mfa/status' ? { enrolled: true, verified, expiresIn: 900 }
      : url.pathname === '/api/admin/operator/tasks' ? { generatedAt: now, overdueReports: 3,
        queues: [{ boardType: 'INQUIRY', pending: 4, overdue: 2, oldest: new Date(Date.now() - 48 * 3600000).toISOString() }],
        oldestTasks: [{ id: 41, boardType: 'INQUIRY', createdAt: new Date(Date.now() - 48 * 3600000).toISOString() }] }
      : url.pathname === '/api/admin/stats/overview' ? { totalUsers: 60, newUsers7d: 2, activePosts: 120, newPosts7d: 5,
        activeComments: 30, pendingReports: 3, journalRecords: 12, journalRecords7d: 1, contents: 4, videos: 2, eventsToday: 10, events7d: 30, topEvents7d: [] }
      : url.pathname === '/api/admin/audit/actions' ? { content: [{ id: 1, actorId: 7, method: 'PATCH', path: '/api/admin/users/8/status', status: 200, requestId: 'fixture-action-1', at: now }], hasNext: false, page: 0 }
      : url.pathname === '/api/admin/audit/members' ? { content: [{ id: 1, actorId: 7, targetUserId: 8, action: 'STATUS_CHANGE', previousRole: null, newRole: null, previousStatus: 'ACTIVE', newStatus: 'SUSPENDED', at: now }], hasNext: false, page: 0 }
      : url.pathname === '/api/admin/developer/overview' ? { sampledAt: now, environment: 'staging', image: 'fixture-image@sha256:' + 'a'.repeat(64), uptimeSeconds: 3660, heapUsedBytes: 104857600, heapMaxBytes: 402653184,
        database: { state: 'UP', version: '8.4.10', migrationVersion: '45', migrationsSuccessful: true, tables: [{ name: 'users', estimatedRows: 60, bytes: 65536 }], poolActive: 1, poolIdle: 4, poolWaiting: 0 },
        host: { state: stale ? 'STALE' : 'FRESH', collectedAt: stale ? new Date(Date.now() - 1800000).toISOString() : now, memoryPercent: 55, rootDiskPercent: 42, databaseDiskPercent: 38, databaseHealthy: true, httpsHealthy: true, backupAgeHours: 2.5, restoreAgeDays: 10, restoreHealthy: true } }
      : url.pathname === '/api/admin/developer/requests' ? { sampledAt: now, capacity: 1000, retainedCount: 40, errors: 1, maxDurationMs: 120, entries: [{ at: now, requestId: 'fixture-error-1', method: 'GET', route: '/api/posts/{postId}', status: 500, durationMs: 120 }] }
      : null;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data }) });
  });
  return calls;
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.describe('operations dashboards', () => {
  test('operator handles waiting tasks and reads member actions without developer menus', async ({ page }, info) => {
    await fixture(page, 'ADMIN'); await page.goto('/admin?tab=dashboard');
    await expect(page.getByRole('heading', { name: '먼저 처리할 일' })).toBeVisible();
    await expect(page.getByRole('link', { name: /이용 문의.*4건 미답변/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /이용 문의 #41/ })).toHaveAttribute('href', '/community/posts/41');
    expect(await page.locator('#admin-tab-select option[value="developer"]').count()).toBe(0);
    await fits(page); await page.screenshot({ path: info.outputPath('operator-tasks.png'), fullPage: true });
    await page.getByLabel('관리 메뉴').selectOption('audit');
    await expect(page.getByText('회원 상태 변경', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '회원 변경', exact: true }).click();
    await expect(page.getByText('정상 → 정지')).toBeVisible();
    await expect(page.getByRole('link', { name: '대상 회원 #8 확인' })).toHaveAttribute('href', '/admin?tab=users&q=%238');
    await expect(page.getByRole('button', { name: '다음', exact: true })).toBeDisabled(); await fits(page);
  });
  test('developer sees DB and request metadata without operator API calls', async ({ page }, info) => {
    const calls = await fixture(page, 'DEVELOPER'); await page.goto('/admin?tab=developer');
    await expect(page.getByRole('heading', { name: '서비스 진단', exact: true })).toBeVisible();
    await expect(page.getByText('8.4.10', { exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('요청 ID: fixture-error-1', { exact: true })).toBeVisible();
    await expect(page.getByLabel('서버 메모리', { exact: true })).toHaveAttribute('value', '55');
    const options = await page.locator('#admin-tab-select option').allTextContents(); expect(options).toEqual(['개발자 진단']);
    expect(calls.some((path) => /\/api\/admin\/(?:operator|users|stats|audit)/.test(path))).toBe(false);
    await page.getByLabel('요청 ID', { exact: true }).fill('fixture-error-1'); await page.getByRole('button', { name: '조회', exact: true }).click();
    await expect.poll(() => calls.some((path) => path.includes('requestId=fixture-error-1'))).toBe(true);
    await fits(page); await page.screenshot({ path: info.outputPath('developer-diagnostics.png'), fullPage: true });
  });
  test('stale host data cannot appear healthy', async ({ page }) => {
    await fixture(page, 'DEVELOPER', true); await page.goto('/admin?tab=developer');
    await expect(page.getByText('수집 지연 · 확인 필요', { exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '최신 서버 상태를 확인할 수 없습니다' })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(0); await fits(page);
  });
  test('developer data waits for MFA and ordinary members cannot open management', async ({ page }) => {
    const calls = await fixture(page, 'DEVELOPER', false, false); await page.goto('/admin?tab=developer');
    await expect(page.getByLabel('인증앱 6자리 번호')).toBeVisible();
    expect(calls.some((path) => path.startsWith('/api/admin/developer'))).toBe(false);
    await page.unroute('**/api/**'); await fixture(page, 'USER'); await page.reload();
    await expect(page.getByRole('heading', { name: '운영 권한이 필요합니다' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '서비스 진단', exact: true })).toHaveCount(0);
  });
});
