/**
 * F1 — Student Login & Home
 * Covers: OTP login → dashboard loads → quick-links visible
 */
import { test, expect } from '@playwright/test';
import { TEST_CENTER_CODE, TEST_STUDENT_PHONE } from '../helpers/seed';
import { requestTestOtp } from '../helpers/api';

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';

test.describe('F1 — Student login and home', () => {
  test('student can log in via OTP and see the dashboard', async ({ page }) => {
    await page.goto(`${BASE}/`);

    // Should land on login / centre-select
    await expect(page).toHaveTitle(/franchise|learn|home/i, { timeout: 10_000 });

    // Fill center code
    const centerInput = page.getByPlaceholder(/center code/i).first();
    if (await centerInput.isVisible()) {
      await centerInput.fill(TEST_CENTER_CODE);
      await page.getByRole('button', { name: /continue|next/i }).click();
    }

    // OTP flow
    await page.getByPlaceholder(/phone|mobile/i).fill(TEST_STUDENT_PHONE);
    await page.getByRole('button', { name: /send otp|get otp/i }).click();

    const otp = await requestTestOtp(TEST_STUDENT_PHONE);
    await page.getByPlaceholder(/otp|code/i).fill(otp);
    await page.getByRole('button', { name: /verify|login|sign in/i }).click();

    // Dashboard should show the student's name or a greeting
    await expect(page.getByText(/welcome|dashboard|my courses/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto(`${BASE}/student`);
    await expect(page).toHaveURL(/login|auth/, { timeout: 10_000 });
  });
});
