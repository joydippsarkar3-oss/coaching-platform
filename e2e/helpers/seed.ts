/**
 * Seed helpers — call the NestJS seeding endpoints (only enabled when
 * NODE_ENV=test) to set up predictable data before each test run.
 */
import { createApiClient, loginAs } from './api';

export const TEST_CENTER_CODE = 'TEST01';
export const TEST_STUDENT_PHONE = '+919000000001';
export const TEST_TEACHER_PHONE = '+919000000002';
export const TEST_ADMIN_PHONE  = '+919000000003';

export async function seedTestData() {
  const adminToken = await loginAs(TEST_ADMIN_PHONE);
  const api = createApiClient(adminToken);

  // Idempotent — backend checks if center already exists
  await api.post('/e2e/seed', {
    centerCode: TEST_CENTER_CODE,
    studentPhone: TEST_STUDENT_PHONE,
    teacherPhone: TEST_TEACHER_PHONE,
  });
}

export async function clearTestData() {
  const adminToken = await loginAs(TEST_ADMIN_PHONE);
  const api = createApiClient(adminToken);
  await api.post('/e2e/teardown', { centerCode: TEST_CENTER_CODE });
}
