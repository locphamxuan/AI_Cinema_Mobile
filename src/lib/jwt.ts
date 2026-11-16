const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes base64url to text without relying on `atob` (absent on some React Native engines). */
function decodeBase64Url(input: string): string {
  const clean = input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error('bad base64');
    value = (value << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }
  return decodeURIComponent(bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join(''));
}

/** The `exp` claim of a JWT in milliseconds, or null when the token cannot be read. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1] ?? '')) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * True when the access token is past (or within `skewSeconds` of) its expiry. Public routes treat an expired token
 * as a Guest instead of answering 401, so the client has to refresh before calling them, not after.
 */
export function tokenExpiresSoon(token: string, now: number = Date.now(), skewSeconds = 30): boolean {
  const expiry = tokenExpiry(token);
  return expiry !== null && expiry - skewSeconds * 1000 <= now;
}
