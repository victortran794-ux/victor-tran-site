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

expect(/<section\b[^>]*class="[^"]*\babout-current\b[^"]*"[^>]*aria-labelledby="about-current-title"/i.test(html),
  'About must include one labeled current-practice section.');
expect(/<h2\b[^>]*id="about-current-title"[^>]*>\s*What I’m doing now\s*<\/h2>/i.test(html),
  'The current-practice section must use the approved direct heading “What I’m doing now”.');
expect(html.includes('Visual Designer, IBM watsonx Orchestrate'),
  'About must preserve Victor’s current IBM watsonx Orchestrate role.');
expect(html.includes('Visual Designer, IBM Cloud'),
  'About must preserve Victor’s IBM Cloud role history.');
const roleTitles = [...html.matchAll(/<h3>([\s\S]*?)<\/h3>/gi)]
  .map((match) => normalize(match[1]))
  .filter((title) => title.startsWith('Visual Designer, IBM'));
expect(roleTitles.length === 2 && roleTitles.every((title) => !title.includes('|')),
  'IBM role titles must not use pipe separators.');
expect(html.includes('January 2024 to present'),
  'About must identify January 2024 as the start of Victor’s IBM watsonx Orchestrate work.');
expect(html.includes('January 2021 to December 2023'),
  'About must identify December 2023 as the end of Victor’s IBM Cloud work.');
expect(!html.includes('AI-assisted workflows'),
  'About must not use generic AI-assistance as a design specialty.');
expect(!html.includes('IBM watsonX Orchestrate'),
  'About must use the official lowercase-x IBM watsonx Orchestrate product name.');
const currentPractice = html.match(/<section\b[^>]*class="[^"]*\babout-current\b[^"]*"[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? '';
const roleHistory = html.match(/<section\b[^>]*class="[^"]*\babout-role-history\b[^"]*"[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? '';
expect(currentPractice.includes('Visual Designer, IBM watsonx Orchestrate') && !currentPractice.includes('Visual Designer, IBM Cloud'),
  'The current-practice section must contain only Victor’s current IBM watsonx Orchestrate role.');
expect(roleHistory.includes('Previously at IBM') && roleHistory.includes('Visual Designer, IBM Cloud'),
  'IBM Cloud must be labeled and contained as previous role history.');
expect(/class="about-current"[\s\S]*class="about-role-history"[\s\S]*class="about-skills"[\s\S]*class="about-work"/i.test(html),
  'Current work and IBM role history must precede skills and past work in the About narrative.');
expect(html.includes('While you’re here, enjoy some Tetris because I like Tetris.'),
  'About must use Victor’s approved direct Tetris invitation.');
expect(html.includes('A few songs from various phases of listening. Enjoy the eclectic mix.'),
  'About must use Victor’s approved music line.');
expect(!html.includes('Tetris, but soft'),
  'The superseded “Tetris, but soft” heading must be removed.');

const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const tagRule = css.match(/\.tag\s*\{[^}]*\}/s)?.[0] ?? '';
expect(tagRule.length > 0, 'The About tag treatment must remain defined.');
expect(!/border-radius:\s*var\(--radius-pill\)/.test(tagRule),
  'About tags must no longer use the generic pill treatment.');

const aboutMarkdown = fs.readFileSync(path.join(root, 'content/about.md'), 'utf8');
expect((aboutMarkdown.match(/^title:\s*"About Victor Tran"$/gm) || []).length === 1,
  'content/about.md must contain one About Victor Tran frontmatter title.');
expect((aboutMarkdown.match(/^# About Victor Tran$/gm) || []).length === 1,
  'content/about.md must contain one About Victor Tran Markdown h1.');
for (const requiredRole of [
  'Visual Designer, IBM watsonx Orchestrate',
  'Visual Designer, IBM Cloud',
  'January 2024 to present',
  'January 2021 to December 2023',
]) {
  expect(aboutMarkdown.includes(requiredRole),
    `content/about.md is missing exported role title: ${requiredRole}`);
}
expect(!aboutMarkdown.includes('AI-assisted workflows'),
  'content/about.md must not export generic AI-assistance as a design specialty.');

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
expect(preflight.includes('run_required "About voice-calibration browser contract" npm run check:about-browser'),
  'Preflight must invoke the About browser contract unconditionally.');

const workflow = fs.readFileSync(path.join(root, '.github/workflows/health-check.yml'), 'utf8');
expect(workflow.includes("needs.changes.outputs.about == 'true'"),
  'Health-check must scope About contracts through classifier ownership.');
expect(workflow.includes('run: node scripts/check-about-semantics.mjs'),
  'Health-check must run the About semantic-heading contract.');
expect(workflow.includes('run: npm run check:about-browser'),
  'Health-check must run the About browser contract.');

if (failures.length) {
  console.error(`About semantic-heading contract failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('About semantic-heading contract passed.');
