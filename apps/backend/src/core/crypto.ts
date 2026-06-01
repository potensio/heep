// OTP hashing uses PBKDF2 (slow by design — resists brute force).
// Token hashing uses HMAC-SHA256 (refresh tokens are random, not passwords).

async function deriveBits(password: string, salt: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 },
    baseKey, 256,
  );
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Store as "salt:hash" so the hash is self-contained.
export async function hashOtpCode(code: string): Promise<string> {
  const salt = bufToHex(crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer);
  const hash = bufToHex(await deriveBits(code, salt));
  return `${salt}:${hash}`;
}

export async function verifyOtpCode(code: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = bufToHex(await deriveBits(code, salt));
  // Constant-time compare via HMAC to prevent timing attacks.
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode('ct-compare'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(actual)),
    crypto.subtle.sign('HMAC', key, enc.encode(expected)),
  ]);
  return bufToHex(a) === bufToHex(b);
}

export function generateOtpCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0]! % 1_000_000).padStart(6, '0');
}

export function generateRefreshToken(): string {
  return bufToHex(crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer);
}

export async function hashRefreshToken(token: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return bufToHex(buf);
}
