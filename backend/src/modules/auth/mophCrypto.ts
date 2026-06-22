import crypto from 'crypto';

/**
 * AES-256-CBC encrypt the app_id before sending it to the BMS Auth Proxy.
 * Output format matches the BMS contract: base64(IV(16) || ciphertext).
 */
export function encryptAppId(appId: string, key = process.env.MOPH_BMS_ENCRYPTION_KEY): string {
  if (!key || key.length !== 32) {
    throw Object.assign(new Error('MOPH_BMS_ENCRYPTION_KEY must be 32 characters'), { status: 503 });
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  const encrypted = Buffer.concat([cipher.update(appId, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64');
}

/** Inverse of encryptAppId — used for round-trip verification. */
export function decryptAppId(payload: string, key = process.env.MOPH_BMS_ENCRYPTION_KEY): string {
  if (!key) throw new Error('missing key');
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 16);
  const data = raw.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
