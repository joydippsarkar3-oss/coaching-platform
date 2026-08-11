/**
 * Global setup: seed test data once before the whole test suite.
 * Runs as the "setup" project in playwright.config.ts
 */
import { test as setup } from '@playwright/test';
import { seedTestData } from '../helpers/seed';

setup('seed database', async () => {
  await seedTestData();
});
