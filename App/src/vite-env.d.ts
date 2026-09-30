/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module 'jsqr' {
  interface QRCode {
    data: string;
    binaryData: number[];
    location: any;
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
  ): QRCode | null;
}
