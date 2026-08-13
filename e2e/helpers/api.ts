import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export function createApiClient(token?: string): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Requests an OTP for a seeded test phone and returns the code.
 * TEST_OTP short-circuits the lookup when the backend runs with a fixed OTP;
 * otherwise the code is read back from the test-only /e2e/otp endpoint.
 */
export async function requestTestOtp(phone: string): Promise<string> {
  const api = createApiClient();
  await api.post('/auth/otp/request', { phone });

  if (process.env.TEST_OTP) return process.env.TEST_OTP;

  const { data } = await api.get<{ code: string | null }>('/e2e/otp', {
    params: { phone },
  });
  if (!data.code) {
    throw new Error(`No active OTP found for ${phone}. Is E2E_FIXTURES_ENABLED=true?`);
  }
  return data.code;
}

/** Full login flow: request OTP → verify → return access token. */
export async function loginAs(phone: string): Promise<string> {
  const api = createApiClient();
  const code = await requestTestOtp(phone);
  const resp = await api.post<{ accessToken: string; refreshToken: string }>(
    '/auth/otp/verify',
    { phone, code },
  );
  return resp.data.accessToken;
}
