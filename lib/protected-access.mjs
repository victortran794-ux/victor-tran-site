const PROTECTED_ROUTE_PATHS = new Set();

export const COOKIE_NAME = '__Host-wxo';

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

async function hmac(value, secret) {
  if (!secret) return '';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}


function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function readCookie(request, name) {
  const source = request.headers.get('cookie') || '';
  for (const part of source.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return '';
    }
  }
  return '';
}

export function normalizeProtectedPath(pathname) {
  let normalized = String(pathname || '');
  for (let pass = 0; pass < 4; pass += 1) {
    let decoded;
    try {
      decoded = decodeURIComponent(normalized);
    } catch {
      break;
    }
    if (decoded === normalized) break;
    normalized = decoded;
  }

  normalized = normalized.replaceAll('\\', '/').replace(/\/{2,}/gu, '/');
  try {
    normalized = new URL(normalized, 'https://protected-path.invalid').pathname;
  } catch {
    // Preserve the bounded-decoding result so malformed protected prefixes fail closed below.
  }
  if (normalized.length > 1) normalized = normalized.replace(/\/+$/gu, '');
  return normalized.toLowerCase();
}

export function isProtectedPath(pathname) {
  const normalized = normalizeProtectedPath(pathname);
  return PROTECTED_ROUTE_PATHS.has(normalized)
    || normalized === '/protected/wxo'
    || normalized.startsWith('/protected/wxo/')
    || normalized.startsWith('/protected/wxo%');
}


export async function createSessionToken(secret, now = Date.now(), ttlSeconds = 60 * 60 * 8) {
  const expires = Math.floor(now / 1000) + ttlSeconds;
  return `${expires}.${await hmac(String(expires), secret)}`;
}

export async function verifySessionToken(token, secret, now = Date.now()) {
  const [expiresText, suppliedSignature, ...extra] = String(token || '').split('.');
  if (extra.length || !/^\d+$/u.test(expiresText || '') || !suppliedSignature || !secret) return false;
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(now / 1000)) return false;
  const expectedSignature = await hmac(expiresText, secret);
  return constantTimeEqual(suppliedSignature, expectedSignature);
}

export async function hasAuthorizedSession(request, secret, now = Date.now()) {
  return verifySessionToken(readCookie(request, COOKIE_NAME), secret, now);
}
