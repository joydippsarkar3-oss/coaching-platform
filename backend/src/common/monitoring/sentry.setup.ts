import * as Sentry from '@sentry/node';

/**
 * Initialises Sentry.  Safe to call unconditionally — exits immediately when
 * SENTRY_DSN is not set so local / test environments are not affected.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}

/**
 * Captures an exception in Sentry.  Any additional context can be passed via
 * `extra` and will be attached to the event.
 *
 * Safe to call even when Sentry was not initialised (SENTRY_DSN not set).
 */
export function captureException(
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureException(err, extra ? { extra } : undefined);
}
