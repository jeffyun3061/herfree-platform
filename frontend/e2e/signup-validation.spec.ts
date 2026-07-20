import { expect, test } from '@playwright/test';

const VALID_PASSWORD = 'Herfree-Test!1';

async function fillRequiredAgreements(page: import('@playwright/test').Page) {
  const agreements = page.locator('input[type="checkbox"]');
  for (let index = 0; index < 4; index += 1) {
    await agreements.nth(index).check();
  }
}

test.describe('signup validation', () => {
  test('uses the 10~24 character policy and clears a corrected confirmation error', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByText('10~24자, 특수문자 1개 이상', { exact: true })).toBeVisible();
    await expect(page.getByText(/15.*64/)).toHaveCount(0);

    await page.getByLabel('이메일').fill('signup-validation@example.invalid');
    await page.locator('input[type="password"]').nth(0).fill(VALID_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill('Different-Test!1');
    await fillRequiredAgreements(page);
    await page.getByRole('button', { name: '가입 완료' }).click();

    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toBeVisible();
    await page.locator('input[type="password"]').nth(1).fill(VALID_PASSWORD);
    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toHaveCount(0);
  });

  test('shows duplicate email beside the field and allows an immediate retry', async ({ page }) => {
    await page.route('**/api/auth/nickname/check?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: '', data: { available: true } }),
      });
    });
    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '이미 사용 중인 이메일입니다.', data: null }),
      });
    });

    await page.goto('/signup');
    await page.getByLabel('이메일').fill('duplicate@example.com');
    await page.locator('input[type="password"]').nth(0).fill(VALID_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill(VALID_PASSWORD);
    await page.getByPlaceholder('커뮤니티에 표시될 이름').fill('가입검증닉네임');
    await page.getByRole('button', { name: '중복확인' }).click();
    await fillRequiredAgreements(page);
    await page.getByRole('button', { name: '가입 완료' }).click();

    await expect(page.getByText('이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해 주세요.')).toBeVisible();
    await page.getByLabel('이메일').fill('available@example.com');
    await expect(page.getByText('이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해 주세요.')).toHaveCount(0);
  });
});
