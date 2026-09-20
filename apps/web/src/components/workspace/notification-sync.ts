export const NOTIFICATION_SYNC_INTERVAL_MS = 30_000;
export const NOTIFICATION_SYNC_INITIAL_DELAY_MS = 5_000;

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000] as const;

export function notificationRetryDelay(failureCount: number) {
  const index = Math.min(Math.max(failureCount, 1) - 1, RETRY_DELAYS_MS.length - 1);
  return RETRY_DELAYS_MS[index]!;
}
