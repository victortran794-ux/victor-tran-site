import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const normalize = (value) => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const mainMatches = [...html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main>/gi)];
const documentH1s = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
expect(mainMatches.length === 1, `about.html must contain exactly one main landmark; found ${mainMatches.length}.`);
expect(documentH1s.length === 1, `about.html must contain exactly one document h1; found ${documentH1s.length}.`);

if (mainMatches.length === 1) {
  const main = mainMatches[0][1];
  const headings = [...main.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)];
  const mainH1s = headings.filter((heading) => heading[1] === '1');

  expect(mainH1s.length === 1, `The sole main must contain exactly one h1; found ${mainH1s.length}.`);
  expect(headings[0]?.[1] === '1', 'The About h1 must be the first heading inside main.');
}

if (documentH1s.length === 1) {
  const [, attributes, content] = documentH1s[0];
  expect(normalize(content) === 'About Victor Tran', 'The About h1 must read “About Victor Tran”.');
  expect(/\bclass="[^"]*\bsr-only\b[^"]*"/i.test(attributes),
    'The About h1 must use the existing sr-only utility to preserve the approved visual composition.');
}

const aboutMarkdown = fs.readFileSync(path.join(root, 'content/about.md'), 'utf8');
expect((aboutMarkdown.match(/^title:\s*"About Victor Tran"$/gm) || []).length === 1,
  'content/about.md must contain one About Victor Tran frontmatter title.');
expect((aboutMarkdown.match(/^# About Victor Tran$/gm) || []).length === 1,
  'content/about.md must contain one About Victor Tran Markdown h1.');

let siteIndex = [];
try {
  siteIndex = JSON.parse(fs.readFileSync(path.join(root, 'content/site-index.json'), 'utf8'));
} catch (error) {
  failures.push(`content/site-index.json must be valid JSON: ${error.message}`);
}
const aboutEntries = Array.isArray(siteIndex)
  ? siteIndex.filter((entry) => entry?.source === 'about.html')
  : [];
expect(aboutEntries.length === 1,
  `content/site-index.json must contain exactly one about.html entry; found ${aboutEntries.length}.`);
expect(aboutEntries[0]?.title === 'About Victor Tran',
  'The about.html site-index entry must be titled About Victor Tran.');

const preflight = fs.readFileSync(path.join(root, 'scripts/preflight.sh'), 'utf8');
expect(preflight.includes('run_required "About semantic-heading contract" node scripts/check-about-semantics.mjs'),
  'Preflight must invoke the About semantic-heading contract unconditionally.');

const workflow = fs.readFileSync(path.join(root, '.github/workflows/health-check.yml'), 'utf8');
const triggerCount = workflow.match(/- "scripts\/check-about-semantics\.mjs"/g)?.length ?? 0;
expect(triggerCount === 2,
  `Health-check path filters must include the About contract for push and pull requests; found ${triggerCount}.`);
for (const dependency of ['content/about.md', 'content/site-index.json']) {
  const escapedDependency = dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const dependencyTriggerCount = workflow.match(new RegExp(`- "${escapedDependency}"`, 'g'))?.length ?? 0;
  expect(dependencyTriggerCount === 2,
    `Health-check path filters must include ${dependency} for push and pull requests; found ${dependencyTriggerCount}.`);
}
expect(workflow.includes('- name: About semantic-heading contract\n        run: node scripts/check-about-semantics.mjs'),
  'Health-check must run the About semantic-heading contract.');

if (failures.length) {
  console.error(`About semantic-heading contract failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('About semantic-heading contract passed.');
