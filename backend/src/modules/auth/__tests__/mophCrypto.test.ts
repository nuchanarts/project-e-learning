import { encryptAppId, decryptAppId } from '../mophCrypto';

const KEY = 'fD7tW8xM9pQ1rZ3yN5uA0vS2bK4gH6jk'; // exactly 32 chars

describe('mophCrypto', () => {
  it('round-trips the app_id through AES-256-CBC', () => {
    const enc = encryptAppId('app-uuid-123', KEY);
    expect(enc).not.toContain('app-uuid-123');
    expect(decryptAppId(enc, KEY)).toBe('app-uuid-123');
  });

  it('produces a different ciphertext each call (random IV)', () => {
    expect(encryptAppId('same', KEY)).not.toBe(encryptAppId('same', KEY));
  });

  it('throws when the key is not 32 characters', () => {
    expect(() => encryptAppId('x', 'too-short')).toThrow();
  });
});
