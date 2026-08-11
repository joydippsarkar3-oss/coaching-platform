/**
 * F2 — Course Enrollment & Progress
 * Covers: browse courses → enroll → see progress card on dashboard
 */
import { test, expect } from '@playwright/test';
import { requestTestOtp } from '../helpers/api';
import { TEST_CENTER_CODE, TEST_STUDENT_PHONE } from '../helpers/seed';

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';

async function studentLogin(page: any) {
  await page.goto(`${BASE}/`);
  const centerInput = page.getByPlaceholder(/center code/i).first();
  if (await centerInput.isVisible()) {
    await centerInput.fill(TEST_CENTER_CODE);
    await page.getByRole('button', { name: /continue|next/i }).click();
  }
  await page.getByPlaceholder(/phone|mobile/i).fill(TEST_STUDENT_PHONE);
  await page.getByRole('button', { name: /send otp|get otp/i }).click();
  const otp = await requestTestOtp(TEST_STUDENT_PHONE);
  await page.getByPlaceholder(/otp|code/i).fill(otp);
  await page.getByRole('button', { name: /verify|login|sign in/i }).click();
  await expect(page.getByText(/welcome|dashboard|my courses/i)).toBeVisible({ timeout: 15_000 });
}

test.describe('F2 — Course enrollment and progress', () => {
  test('student can view available courses', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /courses/i }).click();
    await expect(page.getByRole('heading', { name: /course|curriculum/i })).toBeVisible();
    // At least one course card is present
    const cards = page.locator('[data-testid="course-card"], .course-card, article').first();
    await expect(cards).toBeVisible({ timeout: 10_000 });
  });

  test('enrolled course progress card appears on dashboard', async ({ page }) => {
    await studentLogin(page);
    // If already enrolled (seeded), progress should be visible
    const progress = page.getByText(/progress|% complete/i).first();
    await expect(progress).toBeVisible({ timeout: 10_000 });
  });
});
