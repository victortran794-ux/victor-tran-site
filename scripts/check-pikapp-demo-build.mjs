import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const html = read('pikappapp/demo.html');
const source = fs.existsSync(path.join(root, 'pikappapp/demo-source.jsx'))
  ? read('pikappapp/demo-source.jsx')
  : '';
const generatedCss = fs.existsSync(path.join(root, 'pikappapp/demo.bundle.css'))
  ? read('pikappapp/demo.bundle.css')
  : '';
const generatedJs = fs.existsSync(path.join(root, 'pikappapp/demo.bundle.js'))
  ? read('pikappapp/demo.bundle.js')
  : '';
const packageJson = fs.existsSync(path.join(root, 'package.json'))
  ? JSON.parse(read('package.json'))
  : {};
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');

for (const forbidden of [
  'cdn.tailwindcss.com',
  '@babel/standalone',
  'type="text/babel"',
  'type="importmap"',
  'esm.sh/react',
]) {
  expect(!html.includes(forbidden), `Pi Kapp demo must not load production dependency ${forbidden}.`);
}

expect(html.includes('href="/images/favicon-32.png"'),
  'Pi Kapp demo must declare the existing favicon explicitly.');
expect(html.includes('href="/pikappapp/demo.bundle.css"'),
  'Pi Kapp demo must load its compiled local stylesheet.');
expect(html.includes('src="/pikappapp/demo.bundle.js"'),
  'Pi Kapp demo must load its compiled local module bundle.');
expect(source.includes('tracking-[0.24em] text-pikapp-ink/65'),
  'Pi Kapp section headings must preserve the verified WCAG AA contrast treatment.');
expect(source.includes('text-[11px] text-pikapp-ink/65">{item.when}'),
  'Pi Kapp bulletin timestamps must preserve the verified WCAG AA contrast treatment.');
expect(generatedCss.includes('box-sizing:border-box;border:0 solid #e5e7eb'),
  'Compiled Pi Kapp CSS must include Tailwind Preflight reset styles.');
for (const utility of [
  'bg-pikapp-blue',
  'font-display',
  'shadow-pill',
  'border-pikapp-ink\\/8',
  'text-pikapp-ink\\/65',
]) {
  expect(generatedCss.includes(utility),
    `Compiled Pi Kapp CSS must contain representative utility ${utility}.`);
}
expect(generatedJs.length > 0 && generatedCss.length > 0,
  'Compiled Pi Kapp assets must be nonempty.');
expect(!generatedJs.includes('sourceMappingURL') && !generatedCss.includes('sourceMappingURL'),
  'Compiled Pi Kapp assets must not reference source maps.');
expect(!generatedJs.includes(root) && !generatedCss.includes(root),
  'Compiled Pi Kapp assets must not contain an absolute workspace path.');

for (const file of [
  'pikappapp/demo-source.jsx',
  'pikappapp/demo-source.css',
  'pikappapp/tailwind.config.cjs',
  'pikappapp/demo.bundle.css',
  'pikappapp/demo.bundle.js',
  'package-lock.json',
]) {
  expect(fs.existsSync(path.join(root, file)), `Required Pi Kapp build file is missing: ${file}.`);
}

expect(packageJson.scripts?.['build:pikapp-demo'],
  'package.json must define build:pikapp-demo.');
expect(packageJson.devDependencies?.esbuild && packageJson.devDependencies?.tailwindcss,
  'Pi Kapp build dependencies must be pinned in package.json.');
expect(preflight.includes('npm run verify:pikapp-demo'),
  'Preflight must run the reproducible Pi Kapp demo build verification.');

for (const watchedPath of [
  'package.json',
  'package-lock.json',
  'pikappapp/**',
  'scripts/check-pikapp-demo-build.mjs',
]) {
  const occurrences = workflow.split(`- "${watchedPath}"`).length - 1;
  expect(occurrences >= 2,
    `Site health workflow must watch ${watchedPath} for push and pull_request events.`);
}
expect(workflow.includes('npm run verify:pikapp-demo'),
  'Site health workflow must verify regenerated Pi Kapp demo artifacts.');

if (failures.length) {
  console.error(`Pi Kapp demo build regression check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Pi Kapp demo build regression check passed.');
