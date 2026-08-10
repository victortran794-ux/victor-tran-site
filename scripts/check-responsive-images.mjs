import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function readWebpDimensions(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('invalid WebP RIFF header');
  }
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > bytes.length) throw new Error('truncated WebP chunk');
    if (type === 'VP8 ' && size >= 10) {
      if (bytes[data + 3] !== 0x9d || bytes[data + 4] !== 0x01 || bytes[data + 5] !== 0x2a) throw new Error('invalid VP8 frame header');
      return { width: bytes.readUInt16LE(data + 6) & 0x3fff, height: bytes.readUInt16LE(data + 8) & 0x3fff };
    }
    if (type === 'VP8L' && size >= 5) {
      if (bytes[data] !== 0x2f) throw new Error('invalid VP8L frame header');
      return {
        width: 1 + bytes[data + 1] + ((bytes[data + 2] & 0x3f) << 8),
        height: 1 + ((bytes[data + 2] & 0xc0) >> 6) + (bytes[data + 3] << 2) + ((bytes[data + 4] & 0x0f) << 10),
      };
    }
    if (type === 'VP8X' && size >= 10) {
      return {
        width: 1 + bytes.readUIntLE(data + 4, 3),
        height: 1 + bytes.readUIntLE(data + 7, 3),
      };
    }
    offset = data + size + (size % 2);
  }
  throw new Error('WebP dimensions not found');
}

const expectedImages = [
  'images/responsive/about-vic-japan-480.webp',
  'images/responsive/about-vic-japan-800.webp',
  'images/responsive/about-vic-japan-1200.webp',
  'images/responsive/patterns-hero-640.webp',
  'images/responsive/patterns-hero-1200.webp',
  'images/responsive/pci-handbook-1-cover-640.webp',
  'images/responsive/pci-handbook-1-cover-1200.webp',
  'images/responsive/dna-preview-640.webp',
  'images/responsive/dna-preview-1200.webp',
  'images/responsive/thumb-sal-540.webp',
];
for (const file of expectedImages) {
  expect(fs.existsSync(path.join(root, file)), `${file} must exist.`);
}

const integrityPath = path.join(root, 'images/responsive/manifest.json');
expect(fs.existsSync(integrityPath), 'Responsive derivative integrity manifest must exist.');
if (fs.existsSync(integrityPath)) {
  const integrity = JSON.parse(fs.readFileSync(integrityPath, 'utf8'));
  expect(integrity.pillowVersion === '12.3.0', 'Responsive derivatives must record Pillow 12.3.0.');
  expect(integrity.runtime?.python === '3.14', 'Responsive derivatives must record Python 3.14.');
  expect(typeof integrity.runtime?.webp === 'string' && integrity.runtime.webp.length > 0, 'Responsive derivatives must record libwebp.');
  expect(JSON.stringify(integrity.encoder) === JSON.stringify({ format: 'WEBP', method: 6, quality: 82 }),
    'Responsive derivatives must record the approved encoder configuration.');
  expect(JSON.stringify(Object.keys(integrity.outputs ?? {}).sort()) === JSON.stringify([...expectedImages].sort()),
    'Integrity manifest output keys must exactly match the expected derivative set.');
  for (const source of [
    'images/about-vic-japan.jpg', 'images/patterns-hero.webp',
    'images/pci-handbook-1-cover.webp', 'images/dna-preview.jpg', 'images/thumb-sal.webp',
  ]) {
    const bytes = fs.readFileSync(path.join(root, source));
    const entry = integrity.sources?.[source];
    expect(entry?.bytes === bytes.length, `${source} source byte size must match its integrity record.`);
    expect(entry?.sha256 === crypto.createHash('sha256').update(bytes).digest('hex'),
      `${source} source SHA-256 must match its integrity record.`);
  }
  for (const file of expectedImages) {
    const entry = integrity.outputs?.[file];
    expect(entry, `${file} must have an integrity record.`);
    if (!entry || !fs.existsSync(path.join(root, file))) continue;
    const bytes = fs.readFileSync(path.join(root, file));
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    expect(bytes.length === entry.bytes && bytes.length > 0, `${file} byte size must match its integrity record.`);
    expect(hash === entry.sha256, `${file} SHA-256 must match its integrity record.`);
    try {
      const dimensions = readWebpDimensions(bytes);
      expect(dimensions.width === entry.width && dimensions.height === entry.height,
        `${file} decoded pixel dimensions must match its integrity record.`);
    } catch (error) {
      failures.push(`${file} must be a decodable WebP: ${error.message}`);
    }
    const width = Number(file.match(/-(\d+)\.webp$/)?.[1]);
    expect(entry.width === width, `${file} recorded width must match its filename descriptor.`);
    expect(Number.isInteger(entry.height) && entry.height > 0, `${file} must record a positive pixel height.`);
  }
}

const expectedPatternsCoverHash = '25d3ae87436d367efbda585d5ecd9859ce813d1bcc98cdc961dcc0a2de965d89';
const patternsCoverBytes = fs.readFileSync(path.join(root, 'images/patterns-hero.webp'));
expect(
  crypto.createHash('sha256').update(patternsCoverBytes).digest('hex') === expectedPatternsCoverHash,
  'IBM Patterns homepage thumbnail must use the approved Contact Us Final Playback cover export.',
);
const patternsProvenancePath = path.join(root, 'case-studies/ibm-patterns.md');
expect(fs.existsSync(patternsProvenancePath), 'IBM Patterns homepage thumbnail must retain a source provenance record.');
if (fs.existsSync(patternsProvenancePath)) {
  const provenance = fs.readFileSync(patternsProvenancePath, 'utf8');
  for (const token of [
    'Final Playback.pdf',
    'page 1',
    '7cc91d2efc56ee08a700508854c8c644ac7a4ec136fd9184ffd682ba33cadc23',
    expectedPatternsCoverHash,
  ]) {
    expect(provenance.includes(token), `IBM Patterns provenance record must include ${token}.`);
  }
}

const dashboard = read('PORTFOLIO_DASHBOARD.md');
const outstandingAssetLine = dashboard.split('\n').find(line => line.startsWith('- Victor-supplied')) ?? '';
expect(
  !outstandingAssetLine.includes('IBM Patterns'),
  'Outstanding asset list must not retain the supplied IBM Patterns thumbnail.',
);
expect(
  dashboard.includes('Homepage thumbnail replaced with the approved Final Playback cover and production-verified in PR #133'),
  'Portfolio dashboard must record the IBM Patterns thumbnail as merged and production-verified.',
);

const about = read('about.html');
expect(about.includes('about-vic-japan-480.webp 480w'), 'About portrait must provide a 480w source.');
expect(about.includes('about-vic-japan-800.webp 800w'), 'About portrait must provide an 800w source.');
expect(about.includes('about-vic-japan-1200.webp 1200w'), 'About portrait must provide a 1200w source.');
expect(about.includes('sizes="(max-width: 720px) 320px, 40vw"'), 'About portrait must declare responsive display sizes.');
expect(about.includes('width="1600" height="2400"'), 'About portrait intrinsic dimensions must match its source aspect ratio.');

const homepage = read('index.html');
for (const token of [
  'patterns-hero-640.webp 640w', 'patterns-hero-1200.webp 1200w',
  'pci-handbook-1-cover-640.webp 640w', 'pci-handbook-1-cover-1200.webp 1200w',
  'thumb-sal-540.webp 540w',
  'dna-preview-640.webp 640w', 'dna-preview-1200.webp 1200w',
]) {
  expect(homepage.includes(token), `Homepage must include responsive source ${token}.`);
}
expect(homepage.includes('sizes="(max-width: 720px) 100vw, 50vw"'), 'Homepage project cards must declare responsive display sizes.');

const manifest = JSON.parse(read('data/projects.json'));
for (const id of ['ibm-patterns', 'pci', 'salmagazine']) {
  const project = manifest.projects.find((entry) => entry.slug === id);
  expect(project?.images?.[0]?.srcset, `${id} manifest image must define srcset.`);
  expect(project?.images?.[0]?.sizes, `${id} manifest image must define sizes.`);
}

const workflow = read('.github/workflows/health-check.yml');
expect(workflow.includes('pull_request:'), 'Health workflow must run as a pull-request gate.');
expect(workflow.includes('run: node scripts/check-responsive-images.mjs'),
  'CI must execute the responsive-image regression check.');
for (const watchedPath of [
  'images/**',
  'data/projects.json',
  'scripts/check-responsive-images.mjs',
  'scripts/generate-project-sections.mjs',
  'scripts/generate-responsive-images.py',
  'scripts/preflight.sh',
]) {
  expect(workflow.includes(`"${watchedPath}"`), `${watchedPath} changes must trigger CI.`);
}
expect(workflow.includes('pillow==12.3.0'), 'CI must pin Pillow 12.3.0 for derivative generation.');
expect(workflow.includes('python scripts/generate-responsive-images.py'), 'CI must regenerate responsive derivatives.');
expect(workflow.includes('git diff --exit-code -- images/responsive'), 'CI must compare regenerated derivatives with committed outputs.');

if (failures.length) {
  console.error(`Responsive-image regression check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Responsive-image regression check passed for ${expectedImages.length} derivatives.`);
