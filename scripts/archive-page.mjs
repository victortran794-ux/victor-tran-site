#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ARCHIVE_ROOT = path.join(ROOT, 'archive', 'pages');
const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif',
  '.mp4', '.webm', '.mov', '.m4v', '.pdf'
]);

function usage() {
  console.error('Usage: node scripts/archive-page.mjs <page.html> [reason]');
  console.error('Example: node scripts/archive-page.mjs ibmcloud.html "Archived before redesign"');
}

function today() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function decodeEntities(value = '') {
  const entities = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®', trade: '™'
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, key) => entities[key.toLowerCase()] ?? `&${key};`);
}

function stripTags(value = '') {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(h[1-6]|p|li|dt|dd|blockquote|figcaption)>/gi, '\n')
      .replace(/<\/(section|article|header|footer|main|div)>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function getAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? decodeEntities(match[1].trim()) : '';
}

function normalizeAssetRef(rawRef) {
  if (!rawRef) return null;
  const ref = rawRef.trim();
  if (!ref || ref.startsWith('#')) return null;
  if (/^(https?:|data:|mailto:|tel:|javascript:)/i.test(ref)) return null;

  const withoutQuery = ref.split(/[?#]/)[0];
  if (!withoutQuery) return null;
  const ext = path.extname(withoutQuery).toLowerCase();
  if (!ASSET_EXTENSIONS.has(ext)) return null;
  return withoutQuery.replace(/^\.\//, '');
}

function extractSrcsetRefs(srcset) {
  if (!srcset) return [];
  return srcset
    .split(',')
    .map(part => part.trim().split(/\s+/)[0])
    .map(normalizeAssetRef)
    .filter(Boolean);
}

function extractAssetRefs(html) {
  const refs = new Set();

  for (const tag of html.match(/<(img|source|video|audio|track|iframe|link|a)\b[^>]*>/gi) ?? []) {
    for (const attr of ['src', 'href', 'poster']) {
      const normalized = normalizeAssetRef(getAttr(tag, attr));
      if (normalized) refs.add(normalized);
    }
    for (const normalized of extractSrcsetRefs(getAttr(tag, 'srcset'))) {
      refs.add(normalized);
    }
  }

  for (const match of html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
    const normalized = normalizeAssetRef(match[1]);
    if (normalized) refs.add(normalized);
  }

  return [...refs].sort();
}

function markdownFromHtml(html, sourcePage) {
  const title = stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? sourcePage);
  const metaDescription = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ?? [])[1] ?? '';
  const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) ?? [])[1] ?? html;
  const readable = stripTags(body);

  return [
    '<!--',
    'Archived page content extraction. Do not edit as source of truth unless restoring from this archive.',
    `Source page: ${sourcePage}`,
    '-->',
    '',
    `# ${title || sourcePage}`,
    metaDescription ? `\n> ${decodeEntities(metaDescription)}\n` : '',
    readable
  ].filter(Boolean).join('\n').replace(/\n{4,}/g, '\n\n\n') + '\n';
}

function uniqueArchiveDir(baseName) {
  fs.mkdirSync(ARCHIVE_ROOT, { recursive: true });
  const base = path.join(ARCHIVE_ROOT, `${baseName}-${today()}`);
  if (!fs.existsSync(base)) return base;

  let index = 2;
  while (fs.existsSync(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function copyAsset(ref, archiveDir) {
  const sourcePath = path.resolve(ROOT, ref);
  if (!sourcePath.startsWith(ROOT + path.sep) || !fs.existsSync(sourcePath)) {
    return { ref, copied: false, reason: 'missing' };
  }

  const destination = path.join(archiveDir, 'assets', ref);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(sourcePath, destination);
  return { ref, copied: true, destination: path.relative(archiveDir, destination) };
}

const [pageArg, ...reasonParts] = process.argv.slice(2);
if (!pageArg) {
  usage();
  process.exit(1);
}

const sourcePage = pageArg.replace(/^\.\//, '');
const sourcePath = path.resolve(ROOT, sourcePage);
if (!sourcePath.startsWith(ROOT + path.sep) || !fs.existsSync(sourcePath) || path.extname(sourcePath) !== '.html') {
  console.error(`Page not found or not an HTML file: ${pageArg}`);
  process.exit(1);
}

const slug = path.basename(sourcePage, '.html');
const archiveDir = uniqueArchiveDir(slug);
const html = fs.readFileSync(sourcePath, 'utf8');
const assetRefs = extractAssetRefs(html);
const assetResults = assetRefs.map(ref => copyAsset(ref, archiveDir));
const copied = assetResults.filter(result => result.copied);
const missing = assetResults.filter(result => !result.copied);
const reason = reasonParts.join(' ').trim() || 'Archived page snapshot.';

fs.mkdirSync(archiveDir, { recursive: true });
fs.copyFileSync(sourcePath, path.join(archiveDir, path.basename(sourcePage)));
fs.writeFileSync(path.join(archiveDir, 'content.md'), markdownFromHtml(html, sourcePage));

const manifest = `# ${slug} page archive\n\nArchived: ${today()}\nOriginal path: ${sourcePage}\nReason: ${reason}\n\n## Restore notes\n\n- Treat this folder as a frozen snapshot, not the active source of truth.\n- If restoring, compare against the current live HTML and current assets first.\n- Copied assets preserve their original repo-relative paths under \`assets/\`.\n\n## Files\n\n- \`${path.basename(sourcePage)}\` — archived HTML snapshot\n- \`content.md\` — readable text extraction\n- \`assets/\` — local page assets copied from HTML references\n\n## Assets copied\n\n${copied.length ? copied.map(result => `- ${result.ref} → ${result.destination}`).join('\n') : '- None found'}\n\n## Assets referenced but not copied\n\n${missing.length ? missing.map(result => `- ${result.ref} (${result.reason})`).join('\n') : '- None'}\n`;

fs.writeFileSync(path.join(archiveDir, 'manifest.md'), manifest);

console.log(`Archived ${sourcePage}`);
console.log(`Archive: ${path.relative(ROOT, archiveDir)}`);
console.log(`Assets copied: ${copied.length}`);
if (missing.length) console.log(`Assets missing: ${missing.length}`);
