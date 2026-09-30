// App/src/crypto/keyDerivation.ts

const SALT = new TextEncoder().encode('healorithm-salt-rural-v2-secure');
const ITERATIONS = 100000;

/**
 * Derives a 256-bit AES-GCM CryptoKey from a 4-to-6 digit PIN using PBKDF2.
 */
export async function deriveKeyFromPIN(pin: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // key is non-extractable from memory
    ['encrypt', 'decrypt']
  );
}
