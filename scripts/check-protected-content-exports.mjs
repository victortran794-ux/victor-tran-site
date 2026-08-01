import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const verifyPrivate = process.argv.includes('--private');
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function sameMembers(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function hasProtectedGateContract(html) {
  const robotsTag = Array.from(html.matchAll(/<meta\b[^>]*>/gi))
    .map(match => match[0])
    .find(tag => /name\s*=\s*["']robots["']/i.test(tag));
  const content = robotsTag?.match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
  const directives = new Set(content.toLowerCase().split(/[\s,]+/).filter(Boolean));
  const hasClientGate = /password gate|password-overlay|class=["'][^"']*locked/i.test(html);
  return directives.has('noindex') && directives.has('nofollow') && hasClientGate;
}

let policy;
let siteIndex;

try {
  policy = JSON.parse(read('data/content-export-policy.json'));
} catch (error) {
  fail(`data/content-export-policy.json is missing or invalid: ${error.message}`);
  policy = { protectedPages: [] };
}

if (policy.version !== 1) fail('content export policy must use version 1');
if (!Array.isArray(policy.protectedPages)) fail('content export policy must define protectedPages[]');

const protectedPages = Array.isArray(policy.protectedPages) ? policy.protectedPages : [];
const sources = protectedPages.map(item => item.source);
const slugs = protectedPages.map(item => item.slug);
if (new Set(sources).size !== sources.length) fail('content export policy contains duplicate sources');
if (new Set(slugs).size !== slugs.length) fail('content export policy contains duplicate slugs');

for (const item of protectedPages) {
  if (!item.source?.endsWith('.html')) fail(`invalid protected source: ${item.source}`);
  if (!/^[a-z0-9-]+$/.test(item.slug ?? '')) fail(`invalid protected slug: ${item.slug}`);
}

try {
  siteIndex = JSON.parse(read('content/site-index.json'));
  if (!Array.isArray(siteIndex)) throw new Error('root must be an array');
} catch (error) {
  fail(`content/site-index.json is missing or invalid: ${error.message}`);
  siteIndex = [];
}

const discoveredGates = fs.readdirSync(ROOT)
  .filter(source => source.endsWith('.html'))
  .filter(source => hasProtectedGateContract(read(source)))
  .sort();
const existingPolicySources = protectedPages
  .filter(item => fs.existsSync(path.join(ROOT, item.source)))
  .map(item => item.source)
  .sort();

if (!sameMembers(discoveredGates, existingPolicySources)) {
  fail(`gated HTML and export policy differ: gates=${discoveredGates.join(',')} policy=${existingPolicySources.join(',')}`);
}

const fixedStub = `<!-- Generated protected-content stub. Do not edit directly. -->

# Protected case study

This case study is password-protected. Contact Victor Tran to request access.
`;

for (const item of protectedPages) {
  const sourceExists = fs.existsSync(path.join(ROOT, item.source));
  const publicFile = path.join(ROOT, 'content', `${item.slug}.md`);

  if (!sourceExists) {
    if (!item.provisional) fail(`missing non-provisional protected source: ${item.source}`);
    if (fs.existsSync(publicFile)) fail(`missing provisional source produced public output: ${item.slug}.md`);
    continue;
  }

  if (!fs.existsSync(publicFile)) {
    fail(`missing public protected stub: content/${item.slug}.md`);
  } else {
    const stub = fs.readFileSync(publicFile, 'utf8');
    if (stub !== fixedStub) fail(`protected stub is not the fixed source-independent template: content/${item.slug}.md`);
    if (/## Body Copy|## Images|source:|url:|description:|private-/i.test(stub)) {
      fail(`protected stub contains source-derived structure: content/${item.slug}.md`);
    }
  }

  if (siteIndex.some(page => page.source === item.source || page.contentFile === `content/${item.slug}.md`)) {
    fail(`protected route appears in public site index: ${item.source}`);
  }
}

for (const ignoreFile of ['.gitignore', '.vercelignore']) {
  try {
    const lines = read(ignoreFile).split(/\r?\n/).map(line => line.trim());
    if (!lines.includes('.private-content/')) fail(`${ignoreFile} must exclude .private-content/`);
  } catch (error) {
    fail(`${ignoreFile} is missing: ${error.message}`);
  }
}

if (verifyPrivate) {
  let privateIndex = [];
  try {
    privateIndex = JSON.parse(read('.private-content/site-index.json'));
  } catch (error) {
    fail(`private site index is missing or invalid: ${error.message}`);
  }

  for (const item of protectedPages.filter(entry => fs.existsSync(path.join(ROOT, entry.source)))) {
    const privateFile = path.join(ROOT, '.private-content', `${item.slug}.md`);
    if (!fs.existsSync(privateFile)) {
      fail(`missing private export: .private-content/${item.slug}.md`);
      continue;
    }
    if (fs.readFileSync(privateFile, 'utf8') === fixedStub) {
      fail(`private export incorrectly contains the public stub: ${item.slug}.md`);
    }
    if (!privateIndex.some(page => page.source === item.source)) {
      fail(`private site index missing protected route: ${item.source}`);
    }
  }
}

if (errors.length) {
  console.error('PROTECTED CONTENT EXPORT CONTRACT: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Protected content export contract passed for ${existingPolicySources.length} active protected routes${verifyPrivate ? ' with private mirror verification' : ''}.`);
