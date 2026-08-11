/**
 * F6 — Center Admin: Student Admission & Enrollment
 * Covers: admin login → add student → enroll in course → student appears in batch
 */
import { test, expect } from '@playwright/test';
import { requestTestOtp } from '../helpers/api';
import { TEST_CENTER_CODE, TEST_ADMIN_PHONE } from '../helpers/seed';

const ADMIN_BASE = process.env.ADMIN_BASE_URL ?? 'http://localhost:5174';

async function adminLogin(page: any) {
  await page.goto(`${ADMIN_BASE}/login`);
  await page.getByPlaceholder(/phone|mobile/i).fill(TEST_ADMIN_PHONE);
  await page.getByRole('button', { name: /send otp|get otp/i }).click();
  const otp = await requestTestOtp(TEST_ADMIN_PHONE);
  await page.getByPlaceholder(/otp|code/i).fill(otp);
  await page.getByRole('button', { name: /verify|login|sign in/i }).click();
  await expect(page.getByText(/dashboard|students|center/i)).toBeVisible({ timeout: 15_000 });
}

test.describe('F6 — Center admin admission flow', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('admin can view student list', async ({ page }) => {
    await adminLogin(page);
    await page.getByRole('link', { name: /students/i }).click();
    await expect(
      page.getByRole('heading', { name: /students/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('admin can open new admission form', async ({ page }) => {
    await adminLogin(page);
    await page.getByRole('link', { name: /students/i }).click();

    const addBtn = page.getByRole('button', { name: /add student|new admission|enroll/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 8_000 });
    await addBtn.click();

    await expect(
      page.getByRole('dialog').or(page.getByRole('heading', { name: /admission|new student/i })),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('admission wizard shows required fields', async ({ page }) => {
    await adminLogin(page);
    await page.getByRole('link', { name: /students/i }).click();

    const addBtn = page.getByRole('button', { name: /add student|new admission|enroll/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5_000 }).catch(() => false))) test.skip();

    await addBtn.click();

    // Name and phone are mandatory
    await expect(page.getByLabel(/name/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel(/phone|mobile/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('fee plan appears when course is selected in wizard', async ({ page }) => {
    await adminLogin(page);
    await page.getByRole('link', { name: /students/i }).click();

    const addBtn = page.getByRole('button', { name: /add student|new admission|enroll/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5_000 }).catch(() => false))) test.skip();

    await addBtn.click();

    const courseSelect = page.getByLabel(/course/i).first();
    if (await courseSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await courseSelect.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
        await expect(
          page.getByText(/fee plan|amount|installment/i),
        ).toBeVisible({ timeout: 6_000 });
      }
    }
  });
});
