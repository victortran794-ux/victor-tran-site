#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  COOKIE_NAME,
  createSessionToken,
  hasAuthorizedSession,
  isProtectedPath,
  verifySessionToken,
} from '../lib/protected-access.mjs';
import nodeAccessHandler, { handleAccessRequest } from '../api/wxo-access.mjs';
import { handleProtectedRequest } from '../lib/protected-middleware.mjs';
import { createPasswordVerifier, verifyPassword } from '../lib/password-verifier.mjs';

for (const path of [
  '/wxo-canvas',
  '/wxo-canvas.html',
  '/document-processing',
  '/document-processing.html',
  '/wxo-canvas/',
  '/wxo-canvas%2ehtml',
  '/wxo-canvas%252ehtml',
  '/protected/wxo/current/example.png',
  '/protected/wxo%2fcurrent/example.png',
  '/protected/wxo%252fcurrent/example.png',
  '/protected%2fwxo/current/example.png',
  '/protected%255cwxo%255ccurrent%255cexample.png',
  '/PROTECTED/WXO/current/example.png',
  '/protected/wxo/v2/example.webm',
]) {
  assert.equal(isProtectedPath(path), true, `${path} must require authorization`);
}

for (const path of [
  '/',
  '/about',
  '/ibmcloud',
  '/images/wxo-canvas/wxo-home-thumbnail.png',
  '/wxo-access',
  '/api/wxo-access',
]) {
  assert.equal(isProtectedPath(path), false, `${path} must remain public`);
}

const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
for (const source of [
  '/wxo-access',
  '/wxo-access.html',
  '/wxo-canvas',
  '/wxo-canvas.html',
  '/document-processing',
  '/document-processing.html',
  '/protected/wxo/:path*',
]) {
  const rule = vercelConfig.headers?.find((entry) => entry.source === source);
  assert.ok(rule, `vercel.json must define a no-store header rule for ${source}`);
  const headers = Object.fromEntries(rule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.match(headers['cache-control'] || '', /private,\s*no-store/iu, `${source} must be private and no-store`);
  assert.match(headers['cdn-cache-control'] || '', /no-store/iu, `${source} must disable CDN caching`);
  assert.match(headers['vercel-cdn-cache-control'] || '', /no-store/iu, `${source} must disable Vercel CDN caching`);
}

const now = Date.UTC(2026, 7, 21, 12, 0, 0);
const secret = 'test-session-secret-with-enough-entropy';
assert.equal(COOKIE_NAME, '__Host-wxo', 'session cookie must be host-only by construction');
const token = await createSessionToken(secret, now, 60 * 60);
assert.equal(await verifySessionToken(token, secret, now + 30_000), true, 'fresh signed token must verify');
assert.equal(await verifySessionToken(token, 'wrong-secret', now + 30_000), false, 'token signed by another secret must fail');
assert.equal(await verifySessionToken(token, secret, now + 3_600_001), false, 'expired token must fail');
assert.equal(await verifySessionToken('malformed', secret, now), false, 'malformed token must fail');

const authorized = new Request('https://portfolio.test/protected/wxo/current/example.png', {
  headers: { cookie: `${COOKIE_NAME}=${token}; theme=dark` },
});
const anonymous = new Request('https://portfolio.test/wxo-canvas');
assert.equal(await hasAuthorizedSession(authorized, secret, now + 30_000), true, 'valid auth cookie must authorize');
assert.equal(await hasAuthorizedSession(anonymous, secret, now), false, 'missing auth cookie must fail closed');

const passwordVerifier = await createPasswordVerifier('test-only-password', { cost: 1024 });
assert.match(passwordVerifier, /^scrypt\$/u, 'password verifier must use salted scrypt');
assert.equal(await verifyPassword('test-only-password', passwordVerifier), true, 'matching password must verify');
assert.equal(await verifyPassword('wrong-password', passwordVerifier), false, 'wrong password must fail');
assert.equal(await verifyPassword('test-only-password', ''), false, 'missing configured verifier must fail closed');

function accessRequest(password, next = '/wxo-canvas#document-processing', origin = 'https://portfolio.test') {
  return new Request('https://portfolio.test/api/wxo-access', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
    body: new URLSearchParams({ password, next }),
  });
}

const invalidResponse = await handleAccessRequest(accessRequest('wrong-password'), {
  passwordVerifier,
  sessionSecret: secret,
  now,
});
assert.equal(invalidResponse.status, 303, 'invalid password must return to the gate');
assert.match(invalidResponse.headers.get('location') || '', /^\/wxo-access\?error=1&next=/u);
assert.equal(invalidResponse.headers.has('set-cookie'), false, 'invalid password must not set an auth cookie');

const validResponse = await handleAccessRequest(accessRequest('test-only-password'), {
  passwordVerifier,
  sessionSecret: secret,
  now,
});
assert.equal(validResponse.status, 303, 'valid password must redirect to the protected route');
assert.equal(validResponse.headers.get('location'), '/wxo-canvas#document-processing');
assert.match(validResponse.headers.get('set-cookie') || '', new RegExp(`^${COOKIE_NAME}=`));
for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=28800']) {
  assert.match(validResponse.headers.get('set-cookie') || '', new RegExp(attribute, 'i'), `cookie missing ${attribute}`);
}
assert.doesNotMatch(validResponse.headers.get('set-cookie') || '', /Domain=/iu, 'host cookie must not declare Domain');

const crossOriginResponse = await handleAccessRequest(
  accessRequest('test-only-password', '/wxo-canvas', 'https://attacker.invalid'),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(crossOriginResponse.status, 403, 'cross-origin login POST must be rejected');
assert.equal(crossOriginResponse.headers.has('set-cookie'), false, 'cross-origin POST must not set a cookie');

const unsafeNextResponse = await handleAccessRequest(
  accessRequest('test-only-password', 'https://attacker.invalid/'),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(unsafeNextResponse.headers.get('location'), '/wxo-canvas', 'external next target must be rejected');

assert.equal(typeof nodeAccessHandler.fetch, 'function', 'Vercel access endpoint must use the supported Web Handler export');
const webAdapterResponse = await nodeAccessHandler.fetch(new Request('https://portfolio.test/api/wxo-access'));
assert.equal(webAdapterResponse.status, 405, 'Vercel Web Handler must return the authorization core response');
assert.equal(webAdapterResponse.headers.get('allow'), 'POST', 'Vercel Web Handler must preserve response headers');
assert.match(await webAdapterResponse.text(), /Method not allowed/u, 'Vercel Web Handler must preserve the response body');

const helperCalls = { next: [], rewrite: [] };
const helpers = {
  next: (init) => {
    helperCalls.next.push(init);
    return new Response('continued', { headers: { 'x-test-decision': 'next', ...(init?.headers || {}) } });
  },
  rewrite: (url, init) => {
    helperCalls.rewrite.push({ url, init });
    return new Response('public gate only', {
      headers: { 'x-test-decision': 'rewrite', 'x-test-destination': `${url.pathname}${url.search}`, ...(init?.headers || {}) },
    });
  },
};
const anonymousPageResponse = await handleProtectedRequest(
  new Request('https://portfolio.test/wxo-canvas?lock=1'),
  { sessionSecret: secret, now, ...helpers },
);
assert.equal(anonymousPageResponse.headers.get('x-test-decision'), 'rewrite');
assert.equal(anonymousPageResponse.headers.get('x-test-destination'), '/wxo-access?next=%2Fwxo-canvas');
assert.equal(anonymousPageResponse.headers.get('cache-control'), 'private, no-store');
assert.equal(helperCalls.rewrite.at(-1)?.init?.headers?.['cache-control'], 'private, no-store', 'gate rewrite must pass browser cache policy through Vercel helper options');
assert.equal(helperCalls.rewrite.at(-1)?.init?.headers?.['cdn-cache-control'], 'no-store', 'gate rewrite must disable downstream CDN caching');
assert.equal(helperCalls.rewrite.at(-1)?.init?.headers?.['vercel-cdn-cache-control'], 'no-store', 'gate rewrite must disable Vercel CDN caching');
assert.equal(await anonymousPageResponse.text(), 'public gate only');

const anonymousMediaResponse = await handleProtectedRequest(
  new Request('https://portfolio.test/protected/wxo/current/example.png'),
  { sessionSecret: secret, now, ...helpers },
);
assert.equal(anonymousMediaResponse.status, 404, 'anonymous protected media must not be served');
assert.equal(anonymousMediaResponse.headers.get('cache-control'), 'no-store');
assert.equal(anonymousMediaResponse.headers.get('cdn-cache-control'), 'no-store', 'anonymous media denial must disable downstream CDN caching');
assert.equal(anonymousMediaResponse.headers.get('vercel-cdn-cache-control'), 'no-store', 'anonymous media denial must disable Vercel CDN caching');

for (const encodedMediaPath of [
  '/protected/wxo%2fcurrent/example.png',
  '/protected/wxo%252fcurrent/example.png',
  '/protected%2fwxo/current/example.png',
  '/protected%255cwxo%255ccurrent%255cexample.png',
  '/PROTECTED/WXO/current/example.png',
]) {
  const encodedAnonymousMediaResponse = await handleProtectedRequest(
    new Request(`https://portfolio.test${encodedMediaPath}`),
    { sessionSecret: secret, now, ...helpers },
  );
  assert.equal(encodedAnonymousMediaResponse.status, 404, `${encodedMediaPath} anonymous protected media must fail closed`);
}

const authorizedPageResponse = await handleProtectedRequest(authorized, {
  sessionSecret: secret,
  now: now + 30_000,
  ...helpers,
});
assert.equal(authorizedPageResponse.headers.get('x-test-decision'), 'next', 'signed requests must reach protected files');
assert.equal(authorizedPageResponse.headers.get('cache-control'), 'private, no-store', 'authorized protected responses must not be cached');
assert.equal(helperCalls.next.at(-1)?.headers?.['cache-control'], 'private, no-store', 'authorized continuation must pass browser cache policy through Vercel helper options');
assert.equal(helperCalls.next.at(-1)?.headers?.['cdn-cache-control'], 'no-store', 'authorized continuation must disable downstream CDN caching');
assert.equal(helperCalls.next.at(-1)?.headers?.['vercel-cdn-cache-control'], 'no-store', 'authorized continuation must disable Vercel CDN caching');

const authorizedDocumentResponse = await handleProtectedRequest(
  new Request('https://portfolio.test/document-processing.html', {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
  }),
  { sessionSecret: secret, now: now + 30_000, ...helpers },
);
assert.equal(authorizedDocumentResponse.status, 308, 'authorized legacy document route must redirect');
assert.equal(authorizedDocumentResponse.headers.get('location'), '/wxo-canvas#document-processing');

const forcedGateResponse = await handleProtectedRequest(
  new Request(`https://portfolio.test/wxo-canvas?lock=1`, {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
  }),
  { sessionSecret: secret, now: now + 30_000, ...helpers },
);
assert.equal(forcedGateResponse.headers.get('x-test-decision'), 'rewrite', 'lock=1 must force a fresh gate');

const publicResponse = await handleProtectedRequest(
  new Request('https://portfolio.test/about'),
  { sessionSecret: '', now, ...helpers },
);
assert.equal(publicResponse.headers.get('x-test-decision'), 'next', 'public routes must not depend on protected env');

assert.equal(fs.existsSync('wxo-access.html'), true, 'public gate-only page must exist');
const gateHtml = fs.readFileSync('wxo-access.html', 'utf8');
for (const required of [
  'action="/api/wxo-access"',
  'method="post"',
  'type="password"',
  'autocomplete="current-password"',
  'name="next"',
  'js/wxo-access.js',
]) {
  assert.match(gateHtml, new RegExp(required), `gate page missing ${required}`);
}
for (const forbidden of ['wxo-workflows-vico2', 'protected/wxo/', 'images/wxo-canvas/current/', 'assets/wxo-canvas-v2/']) {
  assert.equal(gateHtml.includes(forbidden), false, `public gate must not reference protected artifact ${forbidden}`);
}

const wxoHtml = fs.readFileSync('wxo-canvas.html', 'utf8');
const middlewareSource = fs.readFileSync('middleware.ts', 'utf8');
assert.match(middlewareSource, /matcher:\s*\['\/:path\*'\]/u, 'routing middleware must inspect every request so encoded protected paths cannot skip authorization');
assert.equal(wxoHtml.includes('js/password-gate.js'), false, 'protected page must not load the retired client gate');
assert.equal(wxoHtml.includes('sessionStorage.getItem(\'vtd-unlock\')'), false, 'protected page must not authorize in the browser');
assert.equal(fs.existsSync('js/password-gate.js'), false, 'client-side hash gate must be retired');
assert.equal(fs.existsSync('assets/wxo-canvas-v2'), false, 'protected V2 media must leave its public path');

const legacyProtectedRefs = [...wxoHtml.matchAll(/(?:src|href|poster)="(?:images\/wxo-canvas\/(?:current|v2)|assets\/(?:wxo-canvas-v2|document-processing))\//gu)];
assert.equal(legacyProtectedRefs.length, 0, 'case-study media must not remain on public asset paths');
const protectedRefs = [...wxoHtml.matchAll(/(?:src|href|poster)="(protected\/wxo\/[^"]+)"/gu)].map((match) => match[1]);
assert.ok(protectedRefs.length >= 26, 'protected page must use the guarded media prefix for its evidence');
for (const asset of new Set(protectedRefs)) {
  assert.equal(fs.existsSync(asset), true, `guarded media is missing: ${asset}`);
}

const publicWxoFiles = fs.readdirSync('images/wxo-canvas', { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(publicWxoFiles, ['wxo-home-thumbnail.png'], 'only the public homepage thumbnail may remain outside the guard');

console.log('Protected delivery unit and deployable-boundary contracts passed.');
