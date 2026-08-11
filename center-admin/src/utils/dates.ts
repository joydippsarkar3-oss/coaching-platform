import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

export const IST = 'Asia/Kolkata'

/**
 * Get current IST time
 */
export function nowIST(): dayjs.Dayjs {
  return dayjs().tz(IST)
}

/**
 * Parse any date string and return IST dayjs
 */
export function toIST(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(date).tz(IST)
}

/**
 * Format date to display string (DD MMM YYYY)
 */
export function formatDate(date: string | Date | dayjs.Dayjs): string {
  return toIST(date).format('DD MMM YYYY')
}

/**
 * Format date+time for display
 */
export function formatDateTime(date: string | Date | dayjs.Dayjs): string {
  return toIST(date).format('DD MMM YYYY, hh:mm A')
}

/**
 * Format to API-friendly ISO string in IST
 */
export function toISOString(date: dayjs.Dayjs): string {
  return date.tz(IST).toISOString()
}

/**
 * Returns true if the date is before today in IST
 */
export function isOverdue(date: string): boolean {
  return toIST(date).isBefore(nowIST(), 'day')
}

/**
 * Human-readable relative time e.g. "3 days ago"
 */
export function fromNow(date: string): string {
  return toIST(date).fromNow()
}

/**
 * Format month for tile display e.g. "Aug 2026"
 */
export function formatMonth(date: string | Date | dayjs.Dayjs): string {
  return toIST(date).format('MMM YYYY')
}
