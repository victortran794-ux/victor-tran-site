import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO = process.cwd();
const GENERATOR = path.join(REPO, 'scripts', 'html-to-md.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'html-to-md-policy-'));
const protectedPages = [
  ['document-processing.html', 'document-processing', 'PRIVATE-DOCUMENT-PROCESSING-SENTINEL'],
];

function write(relative, content) {
  const target = path.join(tmp, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function read(relative) {
  return fs.readFileSync(path.join(tmp, relative), 'utf8');
}

function runGenerator(mode) {
  const result = spawnSync(
    process.execPath,
    [GENERATOR, '--root', tmp, '--mode', mode],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0, `${mode} generation failed:\n${result.stderr}`);
}

function assertInvalidArgsFail(args) {
  const result = spawnSync(process.execPath, [GENERATOR, ...args], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0, `invalid arguments unexpectedly passed: ${args.join(' ')}`);
  assert.equal(fs.existsSync(path.join(tmp, 'content')), false, 'invalid arguments created public output');
  assert.equal(fs.existsSync(path.join(tmp, '.private-content')), false, 'invalid arguments created private output');
}

try {
  const policy = {
    version: 1,
    protectedPages: [
      ...protectedPages.map(([source, slug]) => ({ source, slug })),
      { source: 'wxo-canvas.html', slug: 'wxo-canvas', provisional: true },
    ],
  };
  write('data/content-export-policy.json', `${JSON.stringify(policy, null, 2)}\n`);
  write('index.html', '<title>Public Home</title><h1>Public Home</h1><p>PUBLIC-HOME-SENTINEL</p><img src="chantico.jpg" alt="Chantico\'s Flame illustration"><a href="wxo-canvas.html?lock=1" class="featured-item"><h2 class="featured-item-title">Protected project</h2><p class="section-label">Product Systems</p><img src="protected-thumb.jpg" alt="Protected project thumbnail"></a>');
  write('about.html', '<title>Public About</title><h1>Public About</h1><p>PUBLIC-ABOUT-SENTINEL</p>');
  write('ibmcloud.html', '<title>Public IBM Cloud</title><h1>Public IBM Cloud</h1><p>PUBLIC-IBM-CLOUD-SENTINEL</p>');
  write('ibm-patterns.html', '<title>Public IBM Patterns</title><h1>Public IBM Patterns</h1><p>PUBLIC-IBM-PATTERNS-SENTINEL</p>');
  write('pci.html', '<title>Public PCI</title><h1>Public PCI</h1><p>PUBLIC-PCI-SENTINEL</p>');

  for (const [source, , sentinel] of protectedPages) {
    write(
      source,
      `<title>Private title ${sentinel}</title><meta name="robots" content="noindex,nofollow"><div class="password-overlay">Password gate</div><h1>${sentinel}</h1><p>${sentinel}</p><img src="private-${sentinel}.webp" alt="${sentinel}">`
    );
  }

  assertInvalidArgsFail(['--root']);
  assertInvalidArgsFail(['--root', '--mode', 'private']);
  assertInvalidArgsFail(['--mode']);

  runGenerator('public');

  const publicIndex = JSON.parse(read('content/site-index.json'));
  assert.match(read('content/index.md'), /PUBLIC-HOME-SENTINEL/);
  assert.match(read('content/index.md'), /Chantico's Flame illustration: chantico\.jpg/);
  assert.equal(publicIndex.some(page => page.source === 'index.html'), true);
  assert.deepEqual(
    publicIndex.find(page => page.source === 'index.html')?.projects?.map(project => project.url),
    ['wxo-canvas'],
    'protected entry queries must not leak into canonical content-index project URLs'
  );
  assert.deepEqual(
    publicIndex.find(page => page.source === 'index.html')?.images,
    [
      { src: 'chantico.jpg', alt: "Chantico's Flame illustration" },
      { src: 'protected-thumb.jpg', alt: 'Protected project thumbnail' },
    ],
    'double-quoted attributes must preserve apostrophes inside values'
  );
  assert.match(read('content/ibmcloud.md'), /PUBLIC-IBM-CLOUD-SENTINEL/);
  assert.match(read('content/ibm-patterns.md'), /PUBLIC-IBM-PATTERNS-SENTINEL/);
  assert.match(read('content/pci.md'), /PUBLIC-PCI-SENTINEL/);
  assert.equal(publicIndex.some(page => page.source === 'ibmcloud.html'), true);
  assert.equal(publicIndex.some(page => page.source === 'ibm-patterns.html'), true);
  assert.equal(publicIndex.some(page => page.source === 'pci.html'), true);

  for (const [source, slug, sentinel] of protectedPages) {
    const publicStub = read(`content/${slug}.md`);
    assert.match(publicStub, /Generated protected-content stub/);
    assert.match(publicStub, /^# Protected case study$/m);
    assert.doesNotMatch(publicStub, new RegExp(sentinel));
    assert.doesNotMatch(publicStub, /## Body Copy|## Images|private-/);
    assert.equal(
      publicIndex.some(page => page.source === source),
      false,
      `${source} must be omitted from the public site index`
    );
  }

  assert.equal(fs.existsSync(path.join(tmp, 'content', 'wxo-canvas.md')), false);

  runGenerator('private');
  const privateIndex = JSON.parse(read('.private-content/site-index.json'));

  for (const [source, slug, sentinel] of protectedPages) {
    assert.match(read(`.private-content/${slug}.md`), new RegExp(sentinel));
    assert.equal(
      privateIndex.some(page => page.source === source),
      true,
      `${source} must remain available in explicit private mode`
    );
  }

  assert.equal(fs.existsSync(path.join(tmp, '.private-content', 'wxo-canvas.md')), false);
  console.log('html-to-md protected export fixture passed for public and private modes.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
