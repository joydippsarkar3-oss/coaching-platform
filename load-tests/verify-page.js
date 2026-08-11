import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Load cert numbers from fixture file bundled at test run time via --env or inline
const CERT_NUMBERS = JSON.parse(open('./fixtures/cert-numbers.json'));

export const options = {
  vus: 500,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  // Each VU cycles sequentially through the cert list
  const certNo = CERT_NUMBERS[(__VU * __ITER) % CERT_NUMBERS.length];

  const res = http.get(`${BASE_URL}/verify/${certNo}`, {
    tags: { name: 'verify_cert' },
  });

  check(res, {
    'verify page 200': (r) => r.status === 200,
    'has cert data': (r) => r.body && r.body.length > 0,
  });
}
