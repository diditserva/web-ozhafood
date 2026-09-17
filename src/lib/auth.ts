export const ADMIN_COOKIE_NAME = 'ozhafood_admin_session';

const DEFAULT_SECRET = 'ozhafood-secret-session-key-super-secure-2026';

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createAdminToken(expiresInHours: number = 72): Promise<string> {
  const key = await getCryptoKey(getSecret());
  const exp = Date.now() + expiresInHours * 3600 * 1000;
  const payload = JSON.stringify({ role: 'admin', exp });

  const enc = new TextEncoder();
  const payloadBytes = enc.encode(payload);
  const payloadB64 = toBase64Url(payloadBytes);

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(signature));

  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sigB64] = parts;

  try {
    const key = await getCryptoKey(getSecret());
    const enc = new TextEncoder();

    const sigBytes = fromBase64Url(sigB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    );

    if (!isValid) return false;

    const payloadRaw = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(payloadRaw);

    if (payload.role !== 'admin') return false;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}
