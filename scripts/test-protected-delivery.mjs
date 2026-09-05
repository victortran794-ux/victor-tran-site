#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  '/wxo-canvas',
  '/wxo-canvas.html',
  '/wxo-canvas/',
  '/wxo-canvas%2ehtml',
  '/wxo-canvas%252ehtml',
  '/document-processing',
  '/document-processing.html',
  '/images/document-processing/public/classify-setup.png',
  '/images/wxo-canvas/wxo-home-thumbnail.png',
  '/images/wxo-canvas/public/current-workflow-light.png',
  '/wxo-access',
  '/api/wxo-access',
]) {
  assert.equal(isProtectedPath(path), false, `${path} must remain public`);
}

const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
for (const source of [
  '/wxo-access',
  '/wxo-access.html',
  '/protected/wxo/:path*',
]) {
  const rule = vercelConfig.headers?.find((entry) => entry.source === source);
  assert.ok(rule, `vercel.json must define a no-store header rule for ${source}`);
  const headers = Object.fromEntries(rule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.match(headers['cache-control'] || '', /private,\s*no-store/iu, `${source} must be private and no-store`);
  assert.match(headers['cdn-cache-control'] || '', /no-store/iu, `${source} must disable CDN caching`);
  assert.match(headers['vercel-cdn-cache-control'] || '', /no-store/iu, `${source} must disable Vercel CDN caching`);
}
for (const source of ['/wxo-canvas', '/wxo-canvas.html', '/document-processing', '/document-processing.html']) {
  assert.equal(vercelConfig.headers?.some((entry) => entry.source === source), false, `${source} must not retain private no-store route headers after public authorization`);
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

function accessRequest(password, next = '/document-processing', origin = 'https://portfolio.test') {
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
assert.equal(validResponse.headers.get('location'), '/document-processing');
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

function safariNavigationRequest(overrides = {}) {
  return new Request('https://www.victortrandesign.com/api/wxo-access', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      referer: 'https://www.victortrandesign.com/wxo-access?next=%2Fwxo-canvas',
      'sec-fetch-site': 'same-origin',
      ...overrides,
    },
    body: new URLSearchParams({ password: 'wrong-password', next: '/wxo-canvas' }),
  });
}

const missingOriginSafariResponse = await handleAccessRequest(
  safariNavigationRequest(),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(missingOriginSafariResponse.status, 303, 'same-origin Safari navigation without Origin must reach password verification');
assert.equal(missingOriginSafariResponse.headers.has('set-cookie'), false, 'invalid Safari password must not set a cookie');

const opaqueOriginSafariResponse = await handleAccessRequest(
  safariNavigationRequest({ origin: 'null' }),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(opaqueOriginSafariResponse.status, 303, 'same-origin Safari navigation with opaque Origin must reach password verification');

const capturedSafariResponse = await handleAccessRequest(
  new Request('https://www.victortrandesign.com/api/wxo-access', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'null',
      'sec-fetch-site': 'same-origin',
    },
    body: new URLSearchParams({ password: 'wrong-password', next: '/wxo-canvas' }),
  }),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(capturedSafariResponse.status, 303, 'captured Safari opaque-origin request without Referer must reach password verification');
assert.equal(capturedSafariResponse.headers.has('set-cookie'), false, 'invalid captured Safari password must not set a cookie');

for (const fetchSite of ['same-site', 'cross-site', 'none', null]) {
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    origin: 'null',
  };
  if (fetchSite) headers['sec-fetch-site'] = fetchSite;
  const response = await handleAccessRequest(
    new Request('https://www.victortrandesign.com/api/wxo-access', {
      method: 'POST',
      headers,
      body: new URLSearchParams({ password: 'wrong-password', next: '/wxo-canvas' }),
    }),
    { passwordVerifier, sessionSecret: secret, now },
  );
  assert.equal(response.status, 403, `opaque Origin with ${fetchSite || 'missing'} fetch metadata must fail closed`);
  assert.equal(response.headers.has('set-cookie'), false, 'rejected opaque request must not set a cookie');
}

for (const [label, overrides] of [
  ['cross-site fetch metadata', { 'sec-fetch-site': 'cross-site' }],
  ['untrusted referrer', { referer: 'https://attacker.invalid/wxo-access' }],
  ['untrusted explicit origin', { origin: 'https://attacker.invalid' }],
]) {
  const response = await handleAccessRequest(
    safariNavigationRequest(overrides),
    { passwordVerifier, sessionSecret: secret, now },
  );
  assert.equal(response.status, 403, `${label} must not use Safari fallback`);
  assert.equal(response.headers.has('set-cookie'), false, `${label} must not set a cookie`);
}

let rejectionDiagnostic = '';
const originalWarn = console.warn;
console.warn = (...parts) => { rejectionDiagnostic = parts.join(' '); };
try {
  await handleAccessRequest(
    safariNavigationRequest({ origin: 'https://attacker.invalid' }),
    { passwordVerifier, sessionSecret: secret, now },
  );
} finally {
  console.warn = originalWarn;
}
assert.equal(
  rejectionDiagnostic,
  '[wxo-origin-reject] origin=mismatch referer=accepted fetchSite=same-origin',
  'origin rejection must log only bounded diagnostic categories',
);
assert.doesNotMatch(rejectionDiagnostic, /password|attacker\.invalid|wxo-access/iu, 'origin diagnostics must not log request values');

const trustedAliasResponse = await handleAccessRequest(
  new Request('https://www.victortrandesign.com/api/wxo-access', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://victortrandesign.com',
    },
    body: new URLSearchParams({ password: 'wrong-password', next: '/wxo-canvas' }),
  }),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(trustedAliasResponse.status, 303, 'trusted apex-to-www login redirect must reach password verification');
assert.match(trustedAliasResponse.headers.get('location') || '', /error=1/u, 'invalid alias-origin password must return the normal gate error');
assert.equal(trustedAliasResponse.headers.has('set-cookie'), false, 'invalid alias-origin password must not set a cookie');

const trustedPluralAliasResponse = await handleAccessRequest(
  new Request('https://www.victortrandesigns.com/api/wxo-access', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://victortrandesigns.com',
    },
    body: new URLSearchParams({ password: 'wrong-password', next: '/wxo-canvas' }),
  }),
  { passwordVerifier, sessionSecret: secret, now },
);
assert.equal(trustedPluralAliasResponse.status, 303, 'trusted plural apex-to-www redirect must reach password verification');
assert.equal(trustedPluralAliasResponse.headers.has('set-cookie'), false, 'invalid plural alias-origin password must not set a cookie');

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
assert.equal(anonymousPageResponse.headers.get('x-test-decision'), 'next');
assert.equal(await anonymousPageResponse.text(), 'continued');

const anonymousDocumentResponse = await handleProtectedRequest(
  new Request('https://portfolio.test/document-processing.html'),
  { sessionSecret: secret, now, ...helpers },
);
assert.equal(anonymousDocumentResponse.headers.get('x-test-decision'), 'next');

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
assert.equal(authorizedDocumentResponse.headers.get('x-test-decision'), 'next', 'authorized Document Processing route must reach the standalone file');
assert.equal(authorizedDocumentResponse.headers.has('cache-control'), false, 'public Document Processing responses must not inherit protected cache headers');

const forcedGateResponse = await handleProtectedRequest(
  new Request(`https://portfolio.test/wxo-canvas?lock=1`, {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
  }),
  { sessionSecret: secret, now: now + 30_000, ...helpers },
);
assert.equal(forcedGateResponse.headers.get('x-test-decision'), 'next', 'legacy lock=1 must not re-protect the public wxO route');

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
const documentProcessingHtml = fs.readFileSync('document-processing.html', 'utf8');
const middlewareSource = fs.readFileSync('middleware.ts', 'utf8');
const healthWorkflow = fs.readFileSync('.github/workflows/health-check.yml', 'utf8');
assert.match(middlewareSource, /matcher:\s*\['\/:path\*'\]/u, 'routing middleware must inspect every request so encoded protected paths cannot skip authorization');
assert.equal(healthWorkflow.includes('--exclude "api/wxo-access"'), true, 'link checker must exclude the server-only wxO access endpoint');
assert.equal(wxoHtml.includes('js/password-gate.js'), false, 'protected page must not load the retired client gate');
assert.equal(wxoHtml.includes('sessionStorage.getItem(\'vtd-unlock\')'), false, 'protected page must not authorize in the browser');
assert.equal(fs.existsSync('js/password-gate.js'), false, 'client-side hash gate must be retired');
assert.equal(fs.existsSync('assets/wxo-canvas-v2'), false, 'protected V2 media must leave its public path');

const protectedRouteHtml = documentProcessingHtml;
assert.equal(/(?:src|href|poster|data-theme-(?:light|dark)-src)="protected\/wxo\//u.test(wxoHtml), false, 'public wxO route must not reference guarded media');
const legacyProtectedRefs = [...protectedRouteHtml.matchAll(/(?:src|href|poster)="(?:images\/wxo-canvas\/(?:current|v2)|assets\/(?:wxo-canvas-v2|document-processing))\//gu)];
assert.equal(legacyProtectedRefs.length, 0, 'case-study media must not remain on public asset paths');
const candidatePattern = /(?:^|\s)(?:src|href|poster)="(protected\/wxo\/assets\/public-candidate\/[^"]+)"/gu;
const wxoCandidateRefs = [...wxoHtml.matchAll(candidatePattern)].map((match) => match[1]);
const documentCandidateRefs = [...documentProcessingHtml.matchAll(candidatePattern)].map((match) => match[1]);
const candidateThemeRefs = [...wxoHtml.matchAll(/data-theme-(?:light|dark)-src="(protected\/wxo\/assets\/public-candidate\/[^"]+)"/gu)].map((match) => match[1]);
const candidateRefs = [...wxoCandidateRefs, ...candidateThemeRefs, ...documentCandidateRefs];
const themeSequenceRefs = [...wxoHtml.matchAll(/data-theme-(?:light|dark)-src="(protected\/wxo\/assets\/theme-sequences\/[^"]+)"/gu)].map((match) => match[1]);
const currentDocumentPattern = /(?:^|\s)(?:src|href|poster)="(images\/document-processing\/public\/[^"]+)"/gu;
const wxoCurrentDocumentRefs = [...wxoHtml.matchAll(currentDocumentPattern)].map((match) => match[1]);
const documentCurrentRefs = [...documentProcessingHtml.matchAll(currentDocumentPattern)].map((match) => match[1]);
assert.equal(wxoCandidateRefs.length, 0, 'public wxO route must not initially load guarded public-candidate media.');
assert.equal(candidateThemeRefs.length, 0, 'public wxO route must not declare guarded public-candidate theme media.');
assert.equal(themeSequenceRefs.length, 0, 'public wxO route must not declare guarded theme-sequence media.');
assert.equal(documentCandidateRefs.length, 0, 'public Document Processing route must not render retired guarded public-candidate feature-arc derivatives');
assert.equal(new Set(candidateRefs).size, 0, 'public wxO route must expose no guarded public-candidate sources.');
assert.deepEqual(wxoCurrentDocumentRefs, [], 'public wxO bridge must not expose the protected Classify owner export.');
assert.equal(documentCurrentRefs.length, 12, 'Document Processing must use public owner exports for four feature-arc and eight detailed references.');
assert.equal(new Set(documentCurrentRefs).size, 8, 'Document Processing must render only the eight declared public owner exports.');
const protectedRefs = [...protectedRouteHtml.matchAll(/(?:^|\s)(?:src|href|poster)="(protected\/wxo\/[^"]+)"/gu)].map((match) => match[1]);
for (const asset of new Set([...protectedRefs, ...candidateThemeRefs, ...themeSequenceRefs])) {
  assert.equal(fs.existsSync(asset), true, `guarded media is missing: ${asset}`);
}

const publicWxoFiles = fs.readdirSync('images/wxo-canvas', { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(publicWxoFiles, [
  '15-node-key-states-dark.png', '15-node-key-states-light.png',
  '16-node-size-variants-dark.png', '16-node-size-variants-light.png',
  '17-flow-control-elements-dark.png', '17-flow-control-elements-light.png',
  '18-flow-control-containers-dark.png', '18-flow-control-containers-light.png',
  '19-application-example-dark.png', '19-application-example-light.png',
  '21-workflow-anchors-dark.png', '21-workflow-anchors-light.png',
  'closing-illustration-dark.png', 'closing-illustration-light.png',
  'current-workflow-dark.png', 'current-workflow-light.png',
  'form-configuration-dark.png', 'form-configuration-light.png',
  'form-summary-dark.png', 'form-summary-light.png',
  'form-workflow-dark.png', 'form-workflow-light.png',
  'v2-agent-flow-dark.png', 'v2-agent-flow-light.png',
  'v2-workflow-dark.png', 'v2-workflow-light.png',
  'wxo-home-thumbnail-dark.png', 'wxo-home-thumbnail.png',
].sort(), 'only the two Home thumbnails and audited public wxO narrative exports may remain outside the guard');

assert.deepEqual(protectedRefs, [], 'public Document Processing markup must not reference guarded media');
const projectManifest = JSON.parse(fs.readFileSync('data/projects.json', 'utf8'));
const documentProject = projectManifest.projects.find((project) => project.slug === 'document-processing');
assert.deepEqual(
  { protected: documentProject.protected, noindex: documentProject.noindex, sitemap: documentProject.sitemap, nav: documentProject.nav, homepage: documentProject.homepage },
  { protected: false, noindex: false, sitemap: true, nav: false, homepage: false },
  'Document Processing public discovery metadata must preserve its subordinate navigation and homepage placement',
);
assert.match(documentProcessingHtml, /<meta name="robots" content="index,follow">/u, 'public Document Processing must be indexable');
assert.equal(documentProcessingHtml.includes('site-route-status'), false, 'public Document Processing must not display a private-route status');
const exportPolicy = JSON.parse(fs.readFileSync('data/content-export-policy.json', 'utf8'));
assert.equal(exportPolicy.protectedPages.some((entry) => entry.source === 'document-processing.html'), false, 'public Document Processing must not use a protected content-export policy');
const provenance = JSON.parse(fs.readFileSync('data/document-processing-current-provenance.json', 'utf8'));
const publicDocumentFiles = fs.readdirSync('images/document-processing/public').sort();
const provenanceFiles = provenance.assets.map((asset) => asset.file.replace('images/document-processing/public/', '')).sort();
assert.deepEqual(publicDocumentFiles, provenanceFiles, 'public Document Processing namespace must contain exactly the eight approved owner exports');
assert.deepEqual([...new Set(documentCurrentRefs)].sort(), provenance.assets.map((asset) => asset.file).sort(), 'public Document Processing markup must use exactly the approved public exports');
for (const asset of provenance.assets) {
  const bytes = fs.readFileSync(asset.file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.outputSha256, `${asset.file} must remain byte-identical to its approved owner export`);
}

console.log('Protected delivery unit and deployable-boundary contracts passed.');
