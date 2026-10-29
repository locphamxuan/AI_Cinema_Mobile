/**
 * A key for the Idempotency-Key header: one per member action, so a retried request is charged
 * once. Uses the platform CSPRNG when there is one; uniqueness, not secrecy, is what matters here.
 */
export function idempotencyKey(prefix: string): string {
  const bytes = new Uint8Array(12);
  const cryptoApi = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${Date.now().toString(36)}-${hex}`;
}
