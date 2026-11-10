import { storage, STORAGE_KEYS } from './storage';

/** Left on the device by older versions: the password in plain text and a flag nothing reads now. */
const LEGACY_KEYS = ['ai_cinema_remembered_password', 'ai_cinema_remember_me'];

/** The email the sign-in form fills in; '' when this device remembers none. */
export function readRememberedEmail(): Promise<string> {
  return storage.getString(STORAGE_KEYS.REMEMBERED_EMAIL);
}

/** Only the email is ever kept: staying signed in is the refresh token's job. */
export function rememberEmail(email: string): Promise<void> {
  return storage.set(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim());
}

export function forgetRememberedEmail(): Promise<void> {
  return storage.remove(STORAGE_KEYS.REMEMBERED_EMAIL);
}

/** Run at every start, so an update wipes what older versions saved. Never rejects. */
export async function purgeLegacyCredentials(): Promise<void> {
  await Promise.all(LEGACY_KEYS.map((key) => storage.remove(key)));
}
