import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EXAM_ID = __ENV.TEST_EXAM_ID || '1';

const examDuration = new Trend('exam_attempt_duration', true);
const submitRate = new Rate('exam_submit_success');

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '60s', target: 2000 },
    { duration: '120s', target: 2000 },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

function login() {
  const payload = JSON.stringify({
    phone: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
    otp: '123456',
  });
  const res = http.post(`${BASE_URL}/auth/otp/verify`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });
  check(res, { 'login 200': (r) => r.status === 200 });
  const body = res.json();
  return body && body.token ? body.token : null;
}

function startAttempt(token) {
  const res = http.post(
    `${BASE_URL}/exams/${EXAM_ID}/attempts`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'start_attempt' },
    }
  );
  check(res, { 'start attempt 201': (r) => r.status === 201 });
  const body = res.json();
  return body && body.attemptId ? body.attemptId : null;
}

function submitAnswerBatch(token, attemptId, questionIds) {
  const answers = questionIds.map((qid, idx) => ({
    questionId: qid,
    answer: String.fromCharCode(65 + (idx % 4)), // A–D
  }));
  const res = http.patch(
    `${BASE_URL}/exams/attempts/${attemptId}/answers`,
    JSON.stringify({ answers }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'submit_answers_batch' },
    }
  );
  check(res, { 'batch answers 200': (r) => r.status === 200 });
}

function submitExam(token, attemptId) {
  const res = http.post(
    `${BASE_URL}/exams/attempts/${attemptId}/submit`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: 'submit_exam' },
    }
  );
  const ok = check(res, { 'submit exam 200': (r) => r.status === 200 });
  submitRate.add(ok);
  return ok;
}

export default function () {
  const start = Date.now();

  const token = login();
  if (!token) return;
  sleep(0.5);

  const attemptId = startAttempt(token);
  if (!attemptId) return;
  sleep(0.5);

  // Simulate answering 40 questions in two batches of 20
  const batchA = Array.from({ length: 20 }, (_, i) => `q${i + 1}`);
  const batchB = Array.from({ length: 20 }, (_, i) => `q${i + 21}`);
  submitAnswerBatch(token, attemptId, batchA);
  sleep(1);
  submitAnswerBatch(token, attemptId, batchB);
  sleep(0.5);

  submitExam(token, attemptId);

  examDuration.add(Date.now() - start);
  sleep(1);
}
