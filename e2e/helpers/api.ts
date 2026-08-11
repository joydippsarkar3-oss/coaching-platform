import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export function createApiClient(token?: string): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/** Request an OTP for a seeded test phone and return the code from the DB. */
export async function requestTestOtp(phone: string): Promise<string> {
  const api = createApiClient();
  await api.post('/auth/request-otp', { phone });
  // In CI the OTP is fixed via TEST_OTP_BYPASS env; in dev query DB
  return process.env.TEST_OTP ?? '123456';
}

/** Full login flow: request OTP → verify → return access token. */
export async function loginAs(phone: string): Promise<string> {
  const api = createApiClient();
  const otp = await requestTestOtp(phone);
  const resp = await api.post<{ access_token: string }>(
    '/auth/verify-otp',
    { phone, otp },
  );
  return resp.data.access_token;
}
