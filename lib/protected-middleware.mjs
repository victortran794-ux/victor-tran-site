import {
  hasAuthorizedSession,
  isProtectedPath,
  normalizeProtectedPath,
} from './protected-access.mjs';

const PRIVATE_NO_STORE_HEADERS = Object.freeze({
  'cache-control': 'private, no-store',
  'cdn-cache-control': 'no-store',
  'vercel-cdn-cache-control': 'no-store',
});

const NO_STORE_HEADERS = Object.freeze({
  ...PRIVATE_NO_STORE_HEADERS,
  'cache-control': 'no-store',
});

function requestedNext(pathname) {
  return pathname.startsWith('/document-processing')
    ? '/document-processing'
    : '/wxo-canvas';
}

export async function handleProtectedRequest(request, options = {}) {
  const url = new URL(request.url);
  const pathname = normalizeProtectedPath(url.pathname);
  const nextRequest = options.next;
  const rewriteRequest = options.rewrite;
  if (typeof nextRequest !== 'function' || typeof rewriteRequest !== 'function') {
    throw new TypeError('Protected middleware helpers are required.');
  }

  if (!isProtectedPath(pathname)) return nextRequest();

  const sessionSecret = options.sessionSecret || '';
  const protectedMedia = pathname === '/protected/wxo' || pathname.startsWith('/protected/wxo/');
  const forceFreshGate = url.searchParams.get('lock') === '1' && !protectedMedia;
  if (!forceFreshGate && sessionSecret && await hasAuthorizedSession(request, sessionSecret, options.now)) {
    return nextRequest({
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  }

  if (protectedMedia) {
    return new Response('Not found', {
      status: 404,
      headers: NO_STORE_HEADERS,
    });
  }

  if (!sessionSecret) {
    return new Response('Protected access is temporarily unavailable.', {
      status: 503,
      headers: NO_STORE_HEADERS,
    });
  }

  const gate = new URL('/wxo-access', request.url);
  gate.searchParams.set('next', requestedNext(url.pathname));
  return rewriteRequest(gate, {
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}
