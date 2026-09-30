// App/src/sync/compress.ts
import { gzip, ungzip } from 'pako';

/**
 * Compresses JSON object or string using pako gzip into base64 string.
 */
export function compressGzipPayload(data: any): string {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const compressed = gzip(jsonStr);
  let binary = '';
  const len = compressed.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary);
}

/**
 * Decompresses base64 gzip payload back into JSON or string.
 */
export function decompressGzipPayload<T = any>(base64Data: string): T {
  const binary = atob(base64Data);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressedBytes = ungzip(bytes);
  const decompressed = new TextDecoder().decode(decompressedBytes);
  try {
    return JSON.parse(decompressed) as T;
  } catch {
    return decompressed as unknown as T;
  }
}
