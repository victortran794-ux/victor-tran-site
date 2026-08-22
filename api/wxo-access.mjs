import {
  COOKIE_NAME,
  createSessionToken,
} from '../lib/protected-access.mjs';
import { verifyPassword } from '../lib/password-verifier.mjs';

const MAX_AGE_SECONDS = 60 * 60 * 8;
const DEFAULT_NEXT = '/wxo-canvas';
const TRUSTED_ORIGIN_REDIRECTS = new Map([
  ['https://www.victortrandesign.com', 'https://victortrandesign.com'],
  ['https://www.victortrandesigns.com', 'https://victortrandesigns.com'],
]);

function isAcceptedOrigin(origin, requestOrigin) {
  return origin === requestOrigin || TRUSTED_ORIGIN_REDIRECTS.get(requestOrigin) === origin;
}

function hasAcceptedOrigin(request) {
  const suppliedOrigin = request.headers.get('origin');
  const requestOrigin = new URL(request.url).origin;
  if (suppliedOrigin && suppliedOrigin !== 'null') {
    return isAcceptedOrigin(suppliedOrigin, requestOrigin);
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite !== 'same-origin' && fetchSite !== 'same-site') return false;

  const referrer = request.headers.get('referer');
  if (!referrer) return false;
  try {
    return isAcceptedOrigin(new URL(referrer).origin, requestOrigin);
  } catch {
    return false;
  }
}

function safeNext(value) {
  const candidate = String(value || '');
  if (/^\/wxo-canvas(?:\.html)?(?:[?#][^\r\n]*)?$/u.test(candidate)) return candidate;
  if (/^\/document-processing(?:\.html)?(?:[?#][^\r\n]*)?$/u.test(candidate)) {
    return '/wxo-canvas#document-processing';
  }
  return DEFAULT_NEXT;
}

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 303,
    headers: {
      location,
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export async function handleAccessRequest(request, options = {}) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: 'POST', 'cache-control': 'no-store' },
    });
  }

  if (!hasAcceptedOrigin(request)) {
    return new Response('Access request rejected.', {
      status: 403,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const passwordVerifier = options.passwordVerifier || '';
  const sessionSecret = options.sessionSecret || '';
  if (!passwordVerifier || !sessionSecret) {
    return new Response('Protected access is temporarily unavailable.', {
      status: 503,
      headers: { 'cache-control': 'no-store' },
    });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response('Invalid request.', {
      status: 400,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const next = safeNext(form.get('next'));
  if (!await verifyPassword(String(form.get('password') || ''), passwordVerifier)) {
    return redirect(`/wxo-access?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken(sessionSecret, options.now, MAX_AGE_SECONDS);
  return redirect(next, {
    'set-cookie': `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  });
}

export default {
  fetch(request) {
    return handleAccessRequest(request, {
      passwordVerifier: process.env.WXO_PASSWORD_VERIFIER,
      sessionSecret: process.env.WXO_SESSION_SECRET,
    });
  },
};
