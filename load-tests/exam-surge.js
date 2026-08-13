/**
 * K6 Load Test: Exam Surge
 * Simulates 2,000 concurrent students taking exams
 *
 * Usage:
 *   k6 run --vus 2000 --duration 10m exam-surge.js
 *
 * Thresholds:
 *   - Paper fetch: p95 < 500ms
 *   - Submit attempt: p95 < 1000ms
 *   - Error rate < 1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 500 },   // Ramp up to 500
    { duration: '2m', target: 1000 },  // Ramp to 1,000
    { duration: '2m', target: 2000 },  // Ramp to 2,000
    { duration: '4m', target: 2000 },  // Hold 2,000 for 4 minutes
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1s
    http_req_failed: ['rate<0.01'],    // <1% errors
    errors: ['rate<0.01'],
  },
};

// Mock student credentials pool
const STUDENTS = Array.from({ length: 2000 }, (_, i) => ({
  phone: `91999000${String(i).padStart(4, '0')}`,
  studentId: `STU${String(i + 1).padStart(6, '0')}`,
}));

export function setup() {
  // Optional: Pre-authenticate some students and return tokens
  console.log('Setup: Load test for 2,000 concurrent exam attempts');
  return { startTime: Date.now() };
}

export default function () {
  const student = STUDENTS[__VU % STUDENTS.length];

  // 1. Login (or use cached token)
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/otp/send`, JSON.stringify({
    phone: student.phone,
    role: 'STUDENT',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login request sent': (r) => r.status === 200 || r.status === 201,
  }) || errorRate.add(1);

  sleep(1);

  // Mock OTP verify (in real test, you'd use test OTP or pre-auth tokens)
  const verifyRes = http.post(`${BASE_URL}/api/v1/auth/otp/verify`, JSON.stringify({
    phone: student.phone,
    otp: '123456', // Test OTP
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = '';
  if (verifyRes.status === 200) {
    try {
      token = verifyRes.json('accessToken');
    } catch (e) {
      errorRate.add(1);
      return;
    }
  } else {
    errorRate.add(1);
    return;
  }

  sleep(1);

  // 2. Fetch exam paper
  const paperRes = http.get(`${BASE_URL}/api/v1/exams/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const paperFetched = check(paperRes, {
    'paper fetched successfully': (r) => r.status === 200,
    'paper fetch p95 < 500ms': (r) => r.timings.duration < 500,
  });

  if (!paperFetched) {
    errorRate.add(1);
    return;
  }

  let examId, questions;
  try {
    const exams = paperRes.json();
    if (exams.length === 0) {
      return; // No active exam
    }
    examId = exams[0].id;
    questions = exams[0].questions || [];
  } catch (e) {
    errorRate.add(1);
    return;
  }

  sleep(2);

  // 3. Start attempt
  const startRes = http.post(`${BASE_URL}/api/v1/exams/${examId}/attempts`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(startRes, {
    'attempt started': (r) => r.status === 201,
  }) || errorRate.add(1);

  let attemptId;
  try {
    attemptId = startRes.json('id');
  } catch (e) {
    errorRate.add(1);
    return;
  }

  // Simulate taking exam: student thinks for 10-30s per question
  const thinkTime = Math.random() * 20 + 10;
  sleep(thinkTime);

  // 4. Submit answers
  const answers = questions.map((q) => ({
    questionId: q.id,
    answer: q.options ? q.options[Math.floor(Math.random() * q.options.length)].id : 'A',
  }));

  const submitRes = http.post(
    `${BASE_URL}/api/v1/exams/${examId}/attempts/${attemptId}/submit`,
    JSON.stringify({ answers }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const submitted = check(submitRes, {
    'attempt submitted': (r) => r.status === 200 || r.status === 201,
    'submit p95 < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!submitted) {
    errorRate.add(1);
  }

  sleep(1);
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Teardown: Test ran for ${duration.toFixed(2)}s`);
}
