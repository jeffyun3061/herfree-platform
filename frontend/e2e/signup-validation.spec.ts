import { expect, test } from '@playwright/test';

const VALID_PASSWORD = 'Herfree-Test!1';

async function fillRequiredAgreements(page: import('@playwright/test').Page) {
  const agreements = page.locator('input[type="checkbox"]');
  for (let index = 0; index < 4; index += 1) {
    await agreements.nth(index).check();
  }
}

async function mockAvailableDuplicateChecks(page: import('@playwright/test').Page) {
  const available = {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, message: '', data: { available: true } }),
  };
  await page.route('**/api/auth/email/check?*', (route) => route.fulfill(available));
  await page.route('**/api/auth/nickname/check?*', (route) => route.fulfill(available));
}

test.describe('signup validation', () => {
  test('uses the 10~24 character policy and clears a corrected confirmation error', async ({ page }) => {
    await mockAvailableDuplicateChecks(page);
    await page.goto('/signup');

    await expect(page.getByText('10~24자, 특수문자 1개 이상', { exact: true })).toBeVisible();
    await expect(page.getByText(/15.*64/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '카카오톡으로 시작하기' })).toHaveCount(0);

    await page.locator('#signup-email').fill('signup-validation@example.invalid');
    await page.getByRole('button', { name: '중복확인' }).first().click();
    await page.locator('input[type="password"]').nth(0).fill(VALID_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill('Different-Test!1');
    await page.locator('input[maxlength="20"]').fill('검증닉네임');
    await page.getByRole('button', { name: '중복확인' }).nth(1).click();
    await fillRequiredAgreements(page);
    await page.getByRole('button', { name: '가입 완료' }).click();

    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toBeVisible();
    await page.locator('input[type="password"]').nth(1).fill(VALID_PASSWORD);
    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toHaveCount(0);
  });

  test('requires email and nickname duplicate checks before submit', async ({ page }) => {
    await mockAvailableDuplicateChecks(page);

    await page.goto('/signup');
    await page.locator('#signup-email').fill('ready@example.com');
    await page.getByRole('button', { name: '중복확인' }).first().click();
    await expect(page.getByText('사용 가능한 이메일이에요.')).toBeVisible();

    await page.locator('input[type="password"]').nth(0).fill(VALID_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill(VALID_PASSWORD);
    await page.getByPlaceholder('커뮤니티에 표시될 이름').fill('가입검증닉네임');
    await page.getByRole('button', { name: '중복확인' }).nth(1).click();
    await expect(page.getByText('사용 가능한 닉네임이에요.')).toBeVisible();

    await fillRequiredAgreements(page);
    await expect(page.getByRole('button', { name: '가입 완료' })).toBeEnabled();
  });

  test('shows duplicate email beside the field and allows an immediate retry', async ({ page }) => {
    await page.route('**/api/auth/email/check?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: '', data: { available: false } }),
      });
    });
    await page.route('**/api/auth/nickname/check?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: '', data: { available: true } }),
      });
    });

    await page.goto('/signup');
    await page.locator('#signup-email').fill('duplicate@example.com');
    await page.getByRole('button', { name: '중복확인' }).first().click();
    await expect(page.getByText('이미 가입된 이메일이에요. 로그인하거나 비밀번호 찾기를 이용해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '가입 완료' })).toBeDisabled();

    await page.locator('#signup-email').fill('available@example.com');
    await page.route('**/api/auth/email/check?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: '', data: { available: true } }),
      });
    });
    await page.getByRole('button', { name: '중복확인' }).first().click();
    await expect(page.getByText('사용 가능한 이메일이에요.')).toBeVisible();
  });
});
