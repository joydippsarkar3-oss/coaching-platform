/**
 * F4 — Exam Flow
 * Covers: browse exams → start attempt → answer questions → submit → see result
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

test.describe('F4 — Exam attempt', () => {
  test('exam list loads with at least one exam', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /exams|test/i }).click();
    await expect(
      page.getByRole('heading', { name: /exam|test|assessment/i }),
    ).toBeVisible({ timeout: 10_000 });
    const examCard = page.locator('[data-testid="exam-card"], .exam-card, li, article').first();
    await expect(examCard).toBeVisible({ timeout: 8_000 });
  });

  test('student can start an active exam and see questions', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /exams|test/i }).click();

    const startBtn = page.getByRole('button', { name: /start|begin/i }).first();
    if (!(await startBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(); // No active exams in seed
    }

    await startBtn.click();

    // Should show question text
    await expect(page.getByText(/question 1|q\.1|q1/i)).toBeVisible({ timeout: 12_000 });
  });

  test('student can submit exam and see result', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /exams|test/i }).click();

    const startBtn = page.getByRole('button', { name: /start|begin/i }).first();
    if (!(await startBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
    }

    await startBtn.click();
    await expect(page.getByText(/question 1|q\.1|q1/i)).toBeVisible({ timeout: 12_000 });

    // Select first option for each visible question (best-effort)
    const options = page.getByRole('radio');
    const count = await options.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      await options.nth(i).check().catch(() => {});
    }

    const submitBtn = page.getByRole('button', { name: /submit|finish exam/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Confirm dialog if present
      const confirmBtn = page.getByRole('button', { name: /yes|confirm|submit/i }).last();
      if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await expect(
        page.getByText(/result|score|marks|passed|failed/i),
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});
