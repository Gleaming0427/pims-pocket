import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: false,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    attachScreenshot: false,
    enableNative: false,
  });

}

export function setSentryUser(id: string, role: string, email?: string) {
  Sentry.setUser({ id, email, role });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture une erreur dans Sentry avec le minimum de bruit.
 * À utiliser dans les catch blocks critiques (auth, argent, data).
 */
export function captureError(
  error: unknown,
  context: string,
  level: Sentry.SeverityLevel = 'error'
): void {
  if (!SENTRY_DSN) return;

  const e = error instanceof Error ? error : new Error(String(error));
  console.error(`[${context}]`, e.message);

  Sentry.captureException(e, {
    level,
    tags: { context },
  });
}

export { Sentry };
