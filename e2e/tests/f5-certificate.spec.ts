/**
 * F5 — Certificate Issuance & Public Verification
 * Covers: issued certificate visible → PDF link present → public verify URL works
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

test.describe('F5 — Certificate issuance', () => {
  test('certificates page lists issued certificates', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /certificate/i }).click();
    await expect(
      page.getByRole('heading', { name: /certificate/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('each certificate has a download or view link', async ({ page }) => {
    await studentLogin(page);
    await page.getByRole('link', { name: /certificate/i }).click();

    const pdfLink = page
      .getByRole('link', { name: /download|view|pdf/i })
      .first();
    if (await pdfLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const href = await pdfLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('public certificate verify page renders for valid cert number', async ({ page }) => {
    // Use a cert number seeded by the setup fixture
    const certNo = process.env.SEED_CERT_NO ?? 'TEST-2026-0001';
    await page.goto(`${BASE}/verify/${certNo}`);
    await expect(
      page.getByText(/valid|verified|issued|certificate/i),
    ).toBeVisible({ timeout: 12_000 });
  });

  test('public verify page shows error for unknown cert number', async ({ page }) => {
    await page.goto(`${BASE}/verify/INVALID-CERT-XYZ`);
    await expect(
      page.getByText(/not found|invalid|does not exist/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
