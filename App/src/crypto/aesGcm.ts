// App/src/crypto/aesGcm.ts

/**
 * Encrypts a string/JSON object using AES-GCM 256-bit with a 12-byte random IV.
 * Output is formatted as base64 string: [iv_b64]:[ciphertext_b64].
 */
export async function encryptAESGCM(data: any, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));

  return `${ivB64}:${ctB64}`;
}

/**
 * Decrypts an AES-GCM base64 package. Returns parsed object or raw string.
 */
export async function decryptAESGCM<T = any>(encryptedString: string, key: CryptoKey): Promise<T> {
  const parts = encryptedString.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivB64, ctB64] = parts;
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const decodedStr = dec.decode(decryptedBuffer);

  try {
    return JSON.parse(decodedStr) as T;
  } catch {
    return decodedStr as unknown as T;
  }
}
