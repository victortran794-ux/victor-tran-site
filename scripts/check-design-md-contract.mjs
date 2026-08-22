import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '..');

export const APPROVED_COMPONENT_KEYS = Object.freeze([
  'skip-link-light', 'skip-link-dark', 'text-link-light', 'text-link-dark',
  'featured-surface-orange', 'featured-surface-purple', 'section-surface-light',
  'section-surface-dark', 'media-surface-light', 'media-surface-dark',
  'floating-surface-light', 'floating-surface-dark', 'muted-copy-light',
  'muted-copy-dark', 'divider-light', 'divider-dark', 'media-motion-control-light', 'media-motion-control-dark',
]);

const CANONICAL_SECTIONS = ['Overview', 'Colors', 'Typography', 'Layout', 'Elevation & Depth', 'Shapes', 'Components', "Do's and Don'ts"];
const REQUIRED_PROSE = [
  ['shared-shell boundary', 'shared shell'],
  ['project-native overlay boundary', 'Project overlays extend the shared shell without replacing it.'],
  ['accessibility boundary', 'Target WCAG AA contrast'],
  ['focus boundary', 'focus containment'],
  ['reduced-motion boundary', 'prefers-reduced-motion'],
  ['privacy/protected-content boundary', 'No public file may reveal credentials, protected implementation details, private customer information, or confidential workflows.'],
  ['generated-artifact ownership boundary', 'generator-owned routes and artifacts'],
  ['truthful claims/status boundary', 'truthful project status'],
  ['fictional sample-data disclosure', 'fictional sample-data disclosure'],
  ['publication-lane boundary', 'separate channels'],
  ['project experience modes boundary', 'Project experience modes define three supported levels: Standard, Project-native, and Immersive.'],
  ['immersive shared-shell boundary', 'Immersive experiences enter and return through the shared portfolio shell.'],
  ['immersive reduced-motion boundary', 'A reduced-motion alternative must preserve the same essential content and navigation.'],
];

const REQUIRED_AUTHORITY_PROSE = [
  'Root `DESIGN.md` is the normative design intent and formal agent context',
  '`css/style.css` is the executable runtime implementation',
  '`content/design-system.json` is the contract-checked structured mirror',
  '`content/design-system.md` is the detailed Phase 1 compatibility companion, not a second broad authority',
  'Governance documents own active publication gates and project state',
];

const REQUIRED_TOKEN_NAMES = Object.freeze({
  accents: ['blue', 'pink', 'purple', 'orange'],
  neutrals: ['bg', 'bg-2', 'text', 'text-2', 'border'],
  sharedAliases: ['blue-text', 'surface-canvas', 'surface-section', 'surface-media', 'surface-floating'],
  abilityAliases: ['homepage-ability-orange', 'homepage-ability-blue'],
  spacing: ['1', '2', '3', '4', '5', '6', '8', '10', '12', '14', '16', '20'],
  radii: ['0', 'sm', 'md', 'lg', 'xl', 'pill'],
  fluidType: ['title', 'display', 'hero'],
});

const COLOR_MAP = [
  ['primary', 'light', '--blue'], ['primary-text', 'light', '--blue-text'],
  ['primary-text-dark', 'dark', '--blue'], ['primary-text-dark', 'dark', '--blue-text'],
  ['secondary', 'light', '--pink'], ['tertiary', 'light', '--purple'],
 ['accent-orange', 'light', '--orange'],
  ['light-canvas', 'light', '--bg'], ['light-section', 'light', '--bg-2'], ['light-media', 'light', '--surface-media'], ['light-floating', 'light', '--surface-floating'],
  ['light-text', 'light', '--text'], ['light-muted', 'light', '--text-2'], ['light-border', 'light', '--border'],
  ['dark-canvas', 'dark', '--bg'], ['dark-section', 'dark', '--bg-2'], ['dark-media', 'dark', '--surface-media'], ['dark-floating', 'dark', '--surface-floating'],
  ['dark-text', 'dark', '--text'], ['dark-muted', 'dark', '--text-2'], ['dark-border', 'dark', '--border'],
];


function read(root, relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
function normalize(value) { return String(value).trim().toLowerCase(); }
function error(errors, message) { errors.push(message); }
function getPath(object, dotted) { return dotted.split('.').reduce((value, key) => value?.[key], object); }
function hasExactKeys(object, expected) {
  const actual = Object.keys(object ?? {}).filter((key) => !key.startsWith('$')).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}
function hasExactCssKeys(block, prefix, expected) {
  return hasExactKeys(Object.fromEntries(Object.entries(block).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value])), expected);
}
function isRealUtcCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseDesignMd(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('DESIGN.md must start with YAML front matter');
  return { frontmatter: YAML.parse(match[1]), body: match[2] };
}

export function collectTokenReferences(value, refs = []) {
  if (typeof value === 'string') for (const match of value.matchAll(/\{([^}]+)\}/g)) refs.push(match[1]);
  else if (Array.isArray(value)) value.forEach((item) => collectTokenReferences(item, refs));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectTokenReferences(item, refs));
  return refs;
}

function cssBlocks(css) {
  const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const dark = css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const parse = (block) => Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]));
  return { light: parse(root), dark: parse(dark) };
}

function resolveCssVariable(blocks, theme, property, seen = new Set()) {
  if (seen.has(property)) return undefined;
  const value = (theme === 'dark' ? { ...blocks.light, ...blocks.dark } : blocks.light)[property];
  if (value === undefined) return undefined;
  const reference = value.trim().match(/^var\((--[\w-]+)\)$/)?.[1];
  return reference ? resolveCssVariable(blocks, theme, reference, new Set([...seen, property])) : value.trim();
}

export function runFormalLint(root = DEFAULT_ROOT) {
  const bin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'designmd.cmd' : 'designmd');
  try {
    const output = execFileSync(bin, ['lint', 'DESIGN.md'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const report = JSON.parse(output);
    const findings = report.findings ?? [];
    return { errors: findings.filter((f) => f.severity === 'error' || f.severity === 'warning').map((f) => `${f.rule}: ${f.message}`), report };
  } catch (caught) {
    const output = `${caught.stdout ?? ''}${caught.stderr ?? ''}`;
    return { errors: [`formal lint failed: ${output.trim() || caught.message}`], report: null };
  }
}

export function validateDesignContract(root = DEFAULT_ROOT, { formalLint = false } = {}) {
  const errors = [];
  let design; let json; let css; let prose;
  try { design = parseDesignMd(read(root, 'DESIGN.md')); } catch (caught) { return { errors: [caught.message] }; }
  try { json = JSON.parse(read(root, 'content/design-system.json')); } catch (caught) { error(errors, `design-system.json must parse: ${caught.message}`); }
  css = cssBlocks(read(root, 'css/style.css'));
  prose = read(root, 'content/design-system.md');
  const { frontmatter, body } = design;

  if (frontmatter.version !== 'alpha') error(errors, 'DESIGN.md version must be alpha');
  if (typeof frontmatter.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.updated)) error(errors, 'DESIGN.md updated must be ISO YYYY-MM-DD');
  else if (!isRealUtcCalendarDate(frontmatter.updated)) error(errors, 'DESIGN.md updated must be a real calendar date');
  else if (frontmatter.updated !== json?.updated) error(errors, 'DESIGN.md updated must match design-system.json updated');
  if (/candidate is a planning artifact|not yet the repository authority|\bif adopted\b/i.test(body)) error(errors, 'adopted authority contradiction');
  if (REQUIRED_AUTHORITY_PROSE.some((phrase) => !body.includes(phrase))) error(errors, 'missing adopted authority model');
  if (body.includes('—')) error(errors, 'DESIGN.md must not contain em dashes');
  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1]);
  for (const section of CANONICAL_SECTIONS) if (!headings.includes(section)) error(errors, `missing canonical section: ${section}`);
  const canonicalIndices = CANONICAL_SECTIONS.map((section) => headings.indexOf(section));
  if (canonicalIndices.some((index, i) => index > -1 && i && index < canonicalIndices[i - 1])) error(errors, 'canonical sections are out of order');
  for (const heading of headings) if (headings.filter((candidate) => candidate === heading).length > 1) error(errors, `duplicate heading: ${heading}`);

  for (const reference of collectTokenReferences(frontmatter)) if (getPath(frontmatter, reference) === undefined) error(errors, `broken token reference: {${reference}}`);
  const componentKeys = Object.keys(frontmatter.components ?? {});
  if (componentKeys.length !== APPROVED_COMPONENT_KEYS.length || componentKeys.some((key) => !APPROVED_COMPONENT_KEYS.includes(key))) error(errors, 'live component inventory differs from the approved candidate set');

  for (const [token, theme, property] of COLOR_MAP) {
    if (normalize(frontmatter.colors?.[token]) !== normalize(resolveCssVariable(css, theme, property))) error(errors, `CSS mapping drift: colors.${token} must equal ${theme} ${property}`);
  }
  for (const name of REQUIRED_TOKEN_NAMES.fluidType) {
    const token = json?.typography?.scale?.tokens?.[name];
    const value = resolveCssVariable(css, 'light', `--text-${name}`);
    if (!token || token.value !== value || !body.includes(`\`${value}\``)) error(errors, `fluid type drift: --text-${name}`);
  }
  if (REQUIRED_TOKEN_NAMES.fluidType.some((name) => !json?.typography?.scale?.tokens?.[name]
    || !Object.hasOwn(css.light, `--text-${name}`))) error(errors, 'fluid type inventory drift');
  const spacing = frontmatter.spacing ?? {};
  const expectedSpacingNames = REQUIRED_TOKEN_NAMES.spacing.map((key) => `space-${key}`);
  if (!hasExactKeys(json?.spacing?.scale, REQUIRED_TOKEN_NAMES.spacing)
    || !hasExactKeys(spacing, expectedSpacingNames)
    || !hasExactCssKeys(css.light, '--space-', REQUIRED_TOKEN_NAMES.spacing)) error(errors, 'spacing inventory drift');
  for (const key of REQUIRED_TOKEN_NAMES.spacing) {
    const value = `${json?.spacing?.scale?.[key]}px`;
    if (normalize(spacing[`space-${key}`]) !== normalize(value) || normalize(resolveCssVariable(css, 'light', `--space-${key}`)) !== normalize(value)) error(errors, `spacing drift: --space-${key}`);
  }
  const normalizeDimension = (value) => normalize(value) === '0px' ? '0' : normalize(value);
  const rounded = frontmatter.rounded ?? {};
  const radiusDesignNames = REQUIRED_TOKEN_NAMES.radii.map((key) => key === '0' ? 'none' : key === 'pill' ? 'full' : key);
  if (!hasExactKeys(json?.radii?.tokens, REQUIRED_TOKEN_NAMES.radii)
    || !hasExactKeys(rounded, radiusDesignNames)
    || !hasExactCssKeys(css.light, '--radius-', REQUIRED_TOKEN_NAMES.radii)) error(errors, 'radius inventory drift');
  for (const key of REQUIRED_TOKEN_NAMES.radii) {
    const token = json?.radii?.tokens?.[key];
    const name = key === '0' ? 'none' : key === 'pill' ? 'full' : key;
    if (!token || normalizeDimension(rounded[name]) !== normalizeDimension(token.value) || normalizeDimension(resolveCssVariable(css, 'light', token.css)) !== normalizeDimension(token.value)) error(errors, `radius drift: ${token?.css ?? `--radius-${key}`}`);
  }
  const families = new Set(Object.values(frontmatter.typography ?? {}).map((item) => item.fontFamily));
  for (const family of ['Barlow', 'DM Serif Display', 'Source Code Pro']) if (!families.has(family)) error(errors, `missing required typography family: ${family}`);

  for (const [label, phrase] of REQUIRED_PROSE) if (!body.includes(phrase)) error(errors, `missing ${label}`);
  if (!body.includes('No public file may reveal credentials') || body.includes('wxO implementation details') || body.includes('wxO private media paths')) error(errors, 'protected wxO boundary is missing or contains implementation detail');

  if (json) {
    if (!hasExactKeys(json.colors?.accents, REQUIRED_TOKEN_NAMES.accents)) error(errors, 'accent inventory drift');
    if (!hasExactKeys(json.colors?.neutrals, REQUIRED_TOKEN_NAMES.neutrals)) error(errors, 'neutral inventory drift');
    if (!hasExactKeys(json.colors?.sharedAliases, REQUIRED_TOKEN_NAMES.sharedAliases)) error(errors, 'shared alias inventory drift');
    const abilityAliases = json.colors?.projectScopedOverlays?.['homepage-ability']?.aliases;
    if (!hasExactKeys(abilityAliases, REQUIRED_TOKEN_NAMES.abilityAliases)) error(errors, 'Ability alias inventory drift');
    const pinkRebind = body.match(/Dark pink rebind:\s*`([^`]+)`/i)?.[1];
    const expectedPink = json.colors?.accents?.pink?.inDarkMode;
    const darkPink = resolveCssVariable(css, 'dark', '--pink');
    if (!pinkRebind || normalize(pinkRebind) !== normalize(expectedPink) || normalize(expectedPink) !== normalize(darkPink)) error(errors, 'dark pink prose drift');
    if (/single source of truth/i.test(json.$comment ?? '')) error(errors, 'JSON must not claim to be the single source of truth');
    if (json.authority?.designIntent !== 'DESIGN.md') error(errors, 'JSON authority must name DESIGN.md as normative intent');
    if (json.authority?.runtime !== 'css/style.css') error(errors, 'JSON authority must name css/style.css as executable runtime');
    if (json.authority?.structuredMirror !== true) error(errors, 'JSON must identify itself as a structured mirror');
    for (const [name, token] of Object.entries(json.colors?.accents ?? {})) {
      const light = resolveCssVariable(css, 'light', `--${name}`);
      const dark = resolveCssVariable(css, 'dark', `--${name}`);
      if (normalize(token.value) !== normalize(light) || (token.inDarkMode === 'stable' ? normalize(light) !== normalize(dark) : normalize(token.inDarkMode) !== normalize(dark))) error(errors, `JSON accent drift: ${name}`);
    }
    for (const [name, token] of Object.entries(json.colors?.neutrals ?? {})) {
      const light = resolveCssVariable(css, 'light', `--${name}`);
      const dark = resolveCssVariable(css, 'dark', `--${name}`);
      if (normalize(token.value) !== normalize(light) || normalize(token.inDarkMode) !== normalize(dark)) error(errors, `JSON neutral drift: ${name}`);
    }
    for (const [name, token] of Object.entries(json.colors?.sharedAliases ?? {}).filter(([name]) => !name.startsWith('$'))) {
      const light = resolveCssVariable(css, 'light', token?.css);
      const dark = resolveCssVariable(css, 'dark', token?.css);
      if (!token?.css || normalize(token.value) !== normalize(light) || normalize(token.inDarkMode) !== normalize(dark)) error(errors, `JSON mirror drift: ${name}`);
    }
    const overlay = json.colors?.projectScopedOverlays?.['homepage-ability'];
    if (overlay?.scope !== 'project-native-overlay' || overlay?.universalSharedToken !== false) error(errors, 'Ability aliases must be classified as project-scoped overlays');
    for (const [name, token] of Object.entries(overlay?.aliases ?? {})) {
      if (!token?.css || normalize(token.value) !== normalize(resolveCssVariable(css, 'light', token.css))) error(errors, `JSON overlay drift: ${name}`);
    }
    for (const dormant of json.components?.dormantCandidates ?? []) if ((json.components?.existing ?? []).includes(dormant)) error(errors, `dormant component marked live: ${dormant}`);
  }
  if (!/DESIGN\.md[\s\S]{0,120}normative design intent and formal agent contract/i.test(prose)) error(errors, 'prose companion must point to root DESIGN.md as normative contract');
  if (!/detailed companion[\s\S]{0,80}not a second broad authority/i.test(prose)) error(errors, 'prose companion authority boundary is missing');
  if (!/four accents/i.test(prose)) error(errors, 'prose palette must acknowledge all four accents');

  if (formalLint) errors.push(...runFormalLint(root).errors);
  return { errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateDesignContract(DEFAULT_ROOT, { formalLint: true });
  if (result.errors.length) {
    console.error(`DESIGN.md contract failed:\n- ${result.errors.join('\n- ')}`);
    process.exitCode = 1;
  } else console.log('DESIGN.md contract passed.');
}
