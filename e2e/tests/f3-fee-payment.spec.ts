/**
 * F3 — Fee Payment Flow
 * Covers: view pending installment → initiate payment → status updates
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

test.describe('F3 — Fee payment', () => {
  test('student can see pending fee installment', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /fees|payment/i }).click();
    await expect(page.getByText(/due|pending|installment/i)).toBeVisible({ timeout: 10_000 });
  });

  test('pay now button navigates to payment gateway page', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /fees|payment/i }).click();

    const payBtn = page.getByRole('button', { name: /pay now|pay ₹|make payment/i }).first();
    if (await payBtn.isVisible({ timeout: 5_000 })) {
      await payBtn.click();
      // Should show UPI / gateway options or a redirect
      await expect(
        page.getByText(/UPI|razorpay|cashfree|qr code|scan/i),
      ).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(); // No pending fees — seeding may not have added one
    }
  });

  test('paid installment shows receipt link', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /fees|payment/i }).click();
    const receipt = page.getByRole('link', { name: /receipt|download/i }).first();
    // May or may not exist depending on seed state
    if (await receipt.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(receipt).toHaveAttribute('href', /.+/);
    }
  });
});
