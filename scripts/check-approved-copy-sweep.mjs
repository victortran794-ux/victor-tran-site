import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const suppressedTags = new Set(['script', 'style', 'template', 'noscript']);
let failures = 0;

function decodeEntities(value = '') {
  const entities = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '-', mdash: '-', hellip: '...', copy: '(c)',
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, key) => entities[key.toLowerCase()] ?? `&${key};`);
}

function normalize(value = '') {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

function parseAttributes(token, tagName) {
  const attrs = {};
  const start = token.toLowerCase().indexOf(tagName) + tagName.length;
  const source = token.slice(start, token.length - (token.endsWith('/>') ? 2 : 1));
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function parseHtml(source) {
  const documentNode = { type: 'element', tag: '#document', attrs: {}, children: [] };
  const stack = [documentNode];
  const tokens = source.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/\s*([A-Za-z0-9:-]+)/)?.[1]?.toLowerCase();
      if (!tag) continue;
      while (stack.length > 1) {
        const node = stack.pop();
        if (node.tag === tag) break;
      }
      continue;
    }
    if (token.startsWith('<')) {
      const tag = token.match(/^<\s*([A-Za-z0-9:-]+)/)?.[1]?.toLowerCase();
      if (!tag) continue;
      const node = { type: 'element', tag, attrs: parseAttributes(token, tag), children: [] };
      stack.at(-1).children.push(node);
      if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(node);
      continue;
    }
    stack.at(-1).children.push({ type: 'text', value: token });
  }
  return documentNode;
}

function collect(node, predicate, results = []) {
  if (node.type !== 'element') return results;
  if (predicate(node)) results.push(node);
  for (const child of node.children) collect(child, predicate, results);
  return results;
}

function textOf(node) {
  if (node.type === 'text') return node.value;
  if (suppressedTags.has(node.tag)) return '';
  return normalize(node.children.map(textOf).join(' '));
}

const documents = new Map();
function documentFor(relativePath) {
  if (!documents.has(relativePath)) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    documents.set(relativePath, parseHtml(source));
  }
  return documents.get(relativePath);
}

function nodesFor(relativePath, predicate) {
  return collect(documentFor(relativePath), predicate);
}

function classText(relativePath, className) {
  return normalize(nodesFor(relativePath, node => (node.attrs.class ?? '').split(/\s+/).includes(className)).map(textOf).join(' '));
}

function idText(relativePath, id) {
  return normalize(nodesFor(relativePath, node => node.attrs.id === id).map(textOf).join(' '));
}

function tagText(relativePath, tag) {
  return normalize(nodesFor(relativePath, node => node.tag === tag).map(textOf).join(' '));
}

function metaValues(relativePath, attribute, value) {
  return nodesFor(relativePath, node => node.tag === 'meta' && node.attrs[attribute] === value)
    .map(node => normalize(node.attrs.content ?? ''));
}

function allMetadata(relativePath) {
  return nodesFor(relativePath, node => node.tag === 'meta').map(node => normalize(node.attrs.content ?? '')).join(' ');
}

function requireIncludes(label, source, expected) {
  if (!source.includes(expected)) {
    console.error(`FAIL ${label}: missing approved visible text: ${expected}`);
    failures += 1;
  }
}

function requireExact(label, actual, expected) {
  const values = Array.isArray(actual) ? actual : [actual];
  if (values.length !== 1 || values[0] !== expected) {
    console.error(`FAIL ${label}: expected exact value ${JSON.stringify(expected)}, found ${JSON.stringify(values)}`);
    failures += 1;
  }
}

function forbidRendered(relativePath, retired) {
  const visible = tagText(relativePath, 'html');
  const metadata = allMetadata(relativePath);
  if (visible.includes(retired) || metadata.includes(retired)) {
    console.error(`FAIL ${relativePath}: retired rendered or metadata text remains: ${retired}`);
    failures += 1;
  }
}

const copy = {
  aboutDescription: 'Victor Tran is a visual designer at IBM working on IBM watsonx Orchestrate in Austin, Texas.',
  aboutBody: 'I design interface hierarchy, visual patterns, reusable components, and guidance for enterprise AI and automation workflows. I work closely with UX, product, and development partners through implementation.',
  ibmPosition: 'I used product design and reusable visual systems to make complex cloud work easier to understand and extend.',
  ibmEvent: 'My first start-to-finish product-design project consolidated sources, destinations, subscriptions, and conditions into a simpler stepped flow. Concept testing supported the direction.',
  ibmLogs: 'I explored how IBM Cloud Logs could adopt IBM Cloud visual conventions.',
  ibmIllustration: 'I created most of the original product illustrations and reusable components, then partnered with the team to document and scale the method.',
  gateIdentity: 'IBM watsonx Orchestrate · Protected case study',
  gateDescription: 'Password access for the protected IBM watsonx Orchestrate case study.',
  abilityDescription: 'Brand identity and collateral for The Ability Experience’s 40th anniversary.',
  abilityPrint: 'The illustrated print shows the philanthropy’s origins and volunteer projects from across the country. The same iconography carried into cycling kits worn by riders on the journey from the West Coast to Washington, D.C.',
  abilityChapter: 'The identity carried into cycling kits for The Ability Experience’s summer events.',
  abilityHeading: 'Applying the anniversary identity to the ride.',
  abilityKits: 'The cycling kits carried the anniversary iconography into Gear Up Florida and Journey of Hope and incorporated safety-feature standards.',
  salDescription: 'Five years of layout and art direction for Pi Kappa Phi’s official magazine.',
  salIntro: 'Over five years, I helped shape the layout and art direction of Pi Kappa Phi’s official magazine, stepping into the creative director role in 2018.',
  salNote: 'Five years of issues, art direction, and editorial design.',
  salProgression: 'The work grew from hands-on layout design into creative direction, while I kept designing each issue.',
  salContext: 'First published in fall 1909, Star & Lamp is Pi Kappa Phi’s official magazine. Across five years of issues, the publication developed a more flexible editorial system.',
  piKappRemaster: 'The later V2 direction keeps the original cyan field and member flow recognizable while tightening type, spacing, controls, contrast, and accessibility.',
  piKappBoundary: 'Illustrative concept screens.',
  artIntro: 'Digital and traditional work spanning character illustration, paintings, and personal series.',
  graphicIntro: 'Identity, print, presentation, illustration, and event work from side projects, explorations, and collaborations.',
  uiTitle: 'Interface Studies · Victor Tran Design',
  uiDescription: 'Selected interface studies by Victor Tran, including a high-fidelity Ekos Con visual study.',
  uiIntro: 'A few interface studies and small experiments I liked enough to keep around.',
  magiBoundary: 'Interface details use fictional sample data and are shown as design examples rather than production data.',
};

requireExact('about.html meta[name=description]', metaValues('about.html', 'name', 'description'), copy.aboutDescription);
requireExact('about.html meta[property=og:description]', metaValues('about.html', 'property', 'og:description'), copy.aboutDescription);
requireIncludes('about.html .about-bio', classText('about.html', 'about-bio'), copy.aboutBody);

requireIncludes('ibmcloud.html .ibm-hiring-position', classText('ibmcloud.html', 'ibm-hiring-position'), copy.ibmPosition);
requireIncludes('ibmcloud.html #product-work', idText('ibmcloud.html', 'product-work'), copy.ibmEvent);
requireIncludes('ibmcloud.html #team-action', idText('ibmcloud.html', 'team-action'), copy.ibmLogs);
requireIncludes('ibmcloud.html #visual-systems', idText('ibmcloud.html', 'visual-systems'), copy.ibmIllustration);

requireExact('wxo-access.html title', tagText('wxo-access.html', 'title'), copy.gateIdentity);
requireExact('wxo-access.html meta[name=description]', metaValues('wxo-access.html', 'name', 'description'), copy.gateDescription);
requireExact('wxo-access.html .vtd-gate-eyebrow', classText('wxo-access.html', 'vtd-gate-eyebrow'), copy.gateIdentity);
requireExact('wxo-access.html .vtd-gate-title', classText('wxo-access.html', 'vtd-gate-title'), 'This work is password-protected.');
requireIncludes('wxo-access.html .vtd-gate-body', classText('wxo-access.html', 'vtd-gate-body'), 'Enter the password to view this project. Don’t have one?');

requireExact('abilityexperience.html meta[name=description]', metaValues('abilityexperience.html', 'name', 'description'), copy.abilityDescription);
requireExact('abilityexperience.html meta[property=og:description]', metaValues('abilityexperience.html', 'property', 'og:description'), copy.abilityDescription);
requireIncludes('abilityexperience.html .ability-hero-intro', classText('abilityexperience.html', 'ability-hero-intro'), copy.abilityDescription);
requireIncludes('abilityexperience.html .ability-thesis', classText('abilityexperience.html', 'ability-thesis'), copy.abilityPrint);
requireIncludes('abilityexperience.html .ability-chapter-header', classText('abilityexperience.html', 'ability-chapter-header'), copy.abilityChapter);
requireIncludes('abilityexperience.html .ability-kit-copy', classText('abilityexperience.html', 'ability-kit-copy'), copy.abilityHeading);
requireIncludes('abilityexperience.html .ability-kit-copy', classText('abilityexperience.html', 'ability-kit-copy'), copy.abilityKits);

requireExact('salmagazine.html meta[name=description]', metaValues('salmagazine.html', 'name', 'description'), copy.salDescription);
requireExact('salmagazine.html meta[property=og:description]', metaValues('salmagazine.html', 'property', 'og:description'), copy.salDescription);
requireExact('salmagazine.html .page-header-desc', classText('salmagazine.html', 'page-header-desc'), copy.salIntro);
requireExact('salmagazine.html .sal-vico2-hero-note', classText('salmagazine.html', 'sal-vico2-hero-note'), copy.salNote);
requireIncludes('salmagazine.html .vico2-chapter-header', classText('salmagazine.html', 'vico2-chapter-header'), copy.salProgression);
requireIncludes('salmagazine.html .sal-vico2-story', classText('salmagazine.html', 'sal-vico2-story'), copy.salContext);
requireIncludes('salmagazine.html .sal-vico2-summer-head', classText('salmagazine.html', 'sal-vico2-summer-head'), 'Four favorite spreads from the Summer 2017 issue.');
forbidRendered('salmagazine.html', 'my first issue as creative director');

requireIncludes('pikappapp.html #chapter-4', idText('pikappapp.html', 'chapter-4'), copy.piKappRemaster);
requireIncludes('pikappapp.html #chapter-4', idText('pikappapp.html', 'chapter-4'), copy.piKappBoundary);

requireIncludes('artillustration.html .art-opening', classText('artillustration.html', 'art-opening'), copy.artIntro);
requireIncludes('graphicgallery.html .graphic-opening', classText('graphicgallery.html', 'graphic-opening'), copy.graphicIntro);

requireExact('uigallery.html title', tagText('uigallery.html', 'title'), copy.uiTitle);
requireExact('uigallery.html meta[name=description]', metaValues('uigallery.html', 'name', 'description'), copy.uiDescription);
requireExact('uigallery.html meta[property=og:title]', metaValues('uigallery.html', 'property', 'og:title'), copy.uiTitle);
requireExact('uigallery.html meta[name=twitter:title]', metaValues('uigallery.html', 'name', 'twitter:title'), copy.uiTitle);
requireExact('uigallery.html meta[property=og:description]', metaValues('uigallery.html', 'property', 'og:description'), copy.uiDescription);
requireExact('uigallery.html meta[name=twitter:description]', metaValues('uigallery.html', 'name', 'twitter:description'), copy.uiDescription);
requireIncludes('uigallery.html .ui-gallery-intro', classText('uigallery.html', 'ui-gallery-intro'), copy.uiIntro);
requireIncludes('uigallery.html .ui-study--magi', classText('uigallery.html', 'ui-study--magi'), copy.magiBoundary);

const retired = {
  'about.html': ['About Victor Tran. Visual Designer at IBM, Austin TX.', 'automation workflows, and I work closely with UX, product, and development partners through implementation.'],
  'ibmcloud.html': ['I learned the technical system through documentation and product exploration, then applied that understanding', 'great, neat things that bring delight to a technical experience.', 'I applied that understanding through concept-tested flows, visual adaptation, and reusable illustration methods.', 'Design can reduce uncertainty, surface useful information, and make technical work easier to act on. It can also bring moments of delight to the experience.'],
  'wxo-access.html': ['Password access for a protected portfolio case study.', 'Protected case study · Victor Tran Design'],
  'abilityexperience.html': ['Empowering social change through accessible design. Brand identity and collateral for The Ability Experience.', 'Also using the iconography, the cycling kits are used by nearly 100 student cyclists as they rode', 'sets the branding standard for The Ability Experience', 'Setting the visual standard for the ride.', 'For each new year of team summer events'],
  'salmagazine.html': ['Modernizing a century-old publication. Layout and art direction for the official Pi Kappa Phi magazine.', 'Modernizing a century-old publication. I led the layout and art direction for the official Pi Kappa Phi magazine.', 'A century-old fraternity magazine, redrawn into an award-winning publication.', 'From rinse-and-repeat brochure to industry award winner.', 'this magazine evolved into an industry award-winning publication.'],
  'pikappapp.html': ['the strongest interface decisions across the concept', 'pieces used in the final three screens'],
  'artillustration.html': ['Come check out a variety of my digital and traditional artwork.'],
  'graphicgallery.html': ['A fun plethora of side projects, explorations, and collaborations with neat people and ideas.'],
  'uigallery.html': ['Interface Studies | Victor Tran', 'Selected interface studies by Victor Tran.'],
};

for (const [file, phrases] of Object.entries(retired)) {
  for (const phrase of phrases) forbidRendered(file, phrase);
}

function verifyGeneratedParity() {
  const pages = ['index.html', 'about.html', 'document-processing.html', 'wxo-canvas.html', 'ibmcloud.html', 'ibm-patterns.html', 'pikappapp.html', 'pci.html', 'abilityexperience.html', 'salmagazine.html', 'graphicgallery.html', 'artillustration.html', 'uigallery.html'];
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'approved-copy-generated-'));
  try {
    for (const page of pages) fs.copyFileSync(path.join(root, page), path.join(tempRoot, page));
    fs.mkdirSync(path.join(tempRoot, 'data'), { recursive: true });
    fs.copyFileSync(path.join(root, 'data', 'content-export-policy.json'), path.join(tempRoot, 'data', 'content-export-policy.json'));
    const generated = spawnSync(process.execPath, [path.join(scriptDir, 'html-to-md.mjs'), '--root', tempRoot, '--mode', 'public'], { encoding: 'utf8' });
    if (generated.status !== 0) {
      console.error(`FAIL generated parity: html-to-md failed\n${generated.stderr || generated.stdout}`);
      failures += 1;
      return;
    }
    const tempContent = path.join(tempRoot, 'content');
    for (const entry of fs.readdirSync(tempContent, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const expectedPath = path.join(tempContent, entry.name);
      const actualPath = path.join(root, 'content', entry.name);
      if (!fs.existsSync(actualPath) || !fs.readFileSync(expectedPath).equals(fs.readFileSync(actualPath))) {
        console.error(`FAIL generated parity: content/${entry.name} is stale or missing`);
        failures += 1;
      }
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

verifyGeneratedParity();

if (failures > 0) {
  console.error(`APPROVED COPY SWEEP CONTRACT: FAIL (${failures} issue${failures === 1 ? '' : 's'})`);
  process.exit(1);
}

console.log('APPROVED COPY SWEEP CONTRACT: PASS routes=9 edit-groups=15 semantic-html=pass generated-parity=pass protected-detail=unchanged');
