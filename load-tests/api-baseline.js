import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const readDuration = new Trend('read_req_duration', true);
const writeDuration = new Trend('write_req_duration', true);

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    read_req_duration: ['p(95)<300'],
    write_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

function doRead() {
  const endpoints = ['/courses', '/students', '/fees'];
  const path = endpoints[Math.floor(Math.random() * endpoints.length)];
  const start = Date.now();
  const res = http.get(`${BASE_URL}${path}`, {
    headers: HEADERS,
    tags: { name: `GET ${path}`, type: 'read' },
  });
  readDuration.add(Date.now() - start);
  check(res, { 'read 200': (r) => r.status === 200 });
}

function doWrite() {
  const payload = JSON.stringify({
    studentId: `STU-${Math.floor(10000 + Math.random() * 90000)}`,
    courseId: `CRS-${Math.floor(100 + Math.random() * 900)}`,
    enrolledAt: new Date().toISOString(),
  });
  const start = Date.now();
  const res = http.post(`${BASE_URL}/enrollments`, payload, {
    headers: HEADERS,
    tags: { name: 'POST /enrollments', type: 'write' },
  });
  writeDuration.add(Date.now() - start);
  check(res, { 'write 201': (r) => r.status === 201 });
}

export default function () {
  // 70% reads, 30% writes
  if (Math.random() < 0.7) {
    doRead();
  } else {
    doWrite();
  }
  sleep(0.5);
}
