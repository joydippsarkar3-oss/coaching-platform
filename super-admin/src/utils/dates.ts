import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const IST = 'Asia/Kolkata';

/** Parse any date/string/number into IST dayjs instance */
export function toIST(value: dayjs.ConfigType): dayjs.Dayjs {
  return dayjs(value).tz(IST);
}

/** Display date in IST: "11 Aug 2026" */
export function formatDate(value: dayjs.ConfigType): string {
  return toIST(value).format('DD MMM YYYY');
}

/** Display date + time in IST: "11 Aug 2026, 08:30 PM" */
export function formatDateTime(value: dayjs.ConfigType): string {
  return toIST(value).format('DD MMM YYYY, hh:mm A');
}

/** Relative time: "3 hours ago" */
export function fromNow(value: dayjs.ConfigType): string {
  return toIST(value).fromNow();
}

/** ISO string for API payload in IST */
export function toISOIST(value: dayjs.ConfigType): string {
  return toIST(value).toISOString();
}

/** Current IST time */
export function nowIST(): dayjs.Dayjs {
  return dayjs().tz(IST);
}

export { dayjs };
