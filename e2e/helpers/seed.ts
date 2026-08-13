/**
 * Seed helpers — call the backend's test-only fixture endpoints (mounted only
 * when E2E_FIXTURES_ENABLED=true and NODE_ENV !== production) to set up
 * predictable data before each test run.
 *
 * These calls are deliberately unauthenticated: seeding is what creates the
 * logins, so it cannot itself require one.
 */
import { createApiClient } from './api';

export const TEST_CENTER_CODE = 'TEST01';
export const TEST_STUDENT_PHONE = '+919000000001';
export const TEST_TEACHER_PHONE = '+919000000002';
export const TEST_ADMIN_PHONE  = '+919000000003';

export interface SeededIds {
  centerId: string;
  centerCode: string;
  studentId: string;
  studentUserId: string;
  teacherId: string;
  adminId: string;
  courseId: string;
  batchId: string;
}

export async function seedTestData(): Promise<SeededIds> {
  const api = createApiClient();
  // Idempotent — re-running returns the same IDs rather than duplicating rows.
  const { data } = await api.post<SeededIds>('/e2e/seed', {
    centerCode: TEST_CENTER_CODE,
    studentPhone: TEST_STUDENT_PHONE,
    teacherPhone: TEST_TEACHER_PHONE,
    adminPhone: TEST_ADMIN_PHONE,
  });
  return data;
}

export async function clearTestData(): Promise<void> {
  const api = createApiClient();
  await api.post('/e2e/teardown', { centerCode: TEST_CENTER_CODE });
}
