#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'data', 'projects.json');
const indexPath = path.join(root, 'index.html');
const sitemapPath = path.join(root, 'sitemap.xml');

const errors = [];
const notes = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function decodeEntities(value = '') {
  const entities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, key) => entities[key.toLowerCase()] ?? `&${key};`);
}

function stripTags(value = '') {
  return decodeEntities(value.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function getAttribute(tag, attr) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? decodeEntities(match[1].trim()) : '';
}

function fail(message) {
  errors.push(message);
}

function assertSame(label, actual, expected) {
  const actualText = actual.join(' > ');
  const expectedText = expected.join(' > ');
  if (actualText !== expectedText) {
    fail(`${label} mismatch\n  actual:   ${actualText}\n  expected: ${expectedText}`);
  }
}

function uniqueValues(items, key) {
  const seen = new Set();
  for (const item of items) {
    const value = item[key];
    if (seen.has(value)) fail(`Duplicate ${key} in data/projects.json: ${value}`);
    seen.add(value);
  }
}

function linkHrefs(html) {
  return Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi), match => match[1]);
}

function navSections(indexHtml) {
  const menu = indexHtml.match(/<ul class="nav-dropdown-menu" role="menu">([\s\S]*?)<\/ul>/i)?.[1] ?? '';
  const [primaryHtml = '', galleryHtml = ''] = menu.split(/<li class="nav-dropdown-separator"[\s\S]*?<\/li>/i);
  return {
    primary: linkHrefs(primaryHtml),
    gallery: linkHrefs(galleryHtml),
  };
}

function cardData(sectionHtml) {
  const cards = [];
  const cardPattern = /<a\s+href="([^"]+)"\s+class="([^"]*featured-item[^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of sectionHtml.matchAll(cardPattern)) {
    const block = match[4];
    const imgTag = block.match(/<img\b[^>]*>/i)?.[0] ?? '';
    cards.push({
      href: match[1],
      classes: match[2],
      attrs: match[3],
      chapter: getAttribute(match[0], 'data-chapter'),
      chapterTitle: getAttribute(match[0], 'data-chapter-title'),
      category: stripTags(block.match(/<p[^>]*class="section-label[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ''),
      title: stripTags(block.match(/<h2[^>]*class="featured-item-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? ''),
      image: getAttribute(imgTag, 'src'),
      alt: getAttribute(imgTag, 'alt'),
    });
  }
  return cards;
}

function homepageSections(indexHtml) {
  const primaryHtml = indexHtml.match(/<div class="featured-list">([\s\S]*?)<\/div>\s*<div class="featured-galleries/i)?.[1] ?? '';
  const galleryHtml = indexHtml.match(/<div class="featured-gallery-list">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/i)?.[1] ?? '';
  return {
    primary: cardData(primaryHtml),
    gallery: cardData(galleryHtml),
  };
}

function validateCards(cards, expectedProjects, label) {
  assertSame(`${label} order`, cards.map(card => card.href), expectedProjects.map(project => project.url));

  cards.forEach((card, index) => {
    const expected = expectedProjects[index];
    if (!expected) return;
    if (card.title !== expected.title) fail(`${label} title mismatch for ${expected.url}: ${card.title} !== ${expected.title}`);
    if (card.category !== expected.category) fail(`${label} category mismatch for ${expected.url}: ${card.category} !== ${expected.category}`);
    if (card.chapter !== expected.chapter) fail(`${label} chapter mismatch for ${expected.url}: ${card.chapter} !== ${expected.chapter}`);
    if (card.chapterTitle !== expected.chapterTitle) fail(`${label} chapter title mismatch for ${expected.url}: ${card.chapterTitle} !== ${expected.chapterTitle}`);
    const expectedImage = expected.images?.[0] ?? { src: expected.image, alt: expected.alt };
    if (card.image !== expectedImage.src) fail(`${label} image mismatch for ${expected.url}: ${card.image} !== ${expectedImage.src}`);
    if (card.alt !== expectedImage.alt) fail(`${label} alt mismatch for ${expected.url}: ${card.alt} !== ${expectedImage.alt}`);

    const isWide = card.classes.includes('featured-item--wide');
    if (isWide !== Boolean(expected.wide)) fail(`${label} wide-card flag mismatch for ${expected.url}: html=${isWide}, manifest=${Boolean(expected.wide)}`);
  });
}

function validateGeneratedContent(expectedHomepageProjects) {
  const siteIndexPath = path.join(root, 'content', 'site-index.json');
  if (!fs.existsSync(siteIndexPath)) return fail('content/site-index.json missing; regenerate with node scripts/html-to-md.mjs');
  const siteIndex = JSON.parse(fs.readFileSync(siteIndexPath, 'utf8'));
  const homepage = siteIndex.find(page => page.source === 'index.html');
  if (!homepage) return fail('content/site-index.json has no index.html entry');

  assertSame(
    'content/site-index.json project order',
    (homepage.projects ?? []).map(project => `${project.url}.html`),
    expectedHomepageProjects.map(project => project.url),
  );
}

function validateProtected(projects) {
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';

  for (const project of projects) {
    const filePath = path.join(root, project.url);
    if (!fs.existsSync(filePath)) {
      fail(`Missing project HTML file for ${project.slug}: ${project.url}`);
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const sitemapHasProject = sitemap.includes(project.url) || sitemap.includes(`/${project.slug}`);

    if (project.noindex && !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
      fail(`${project.url} is marked noindex=true in manifest, but no robots noindex meta tag was found`);
    }
    if (project.sitemap === false && sitemapHasProject) {
      fail(`${project.url} is marked sitemap=false in manifest, but appears in sitemap.xml`);
    }
    if (project.protected && !html.includes('password') && !html.includes('protected')) {
      fail(`${project.url} is marked protected=true in manifest, but no password/protected marker was found`);
    }
  }
}

if (!fs.existsSync(manifestPath)) {
  fail('data/projects.json missing');
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const projects = manifest.projects ?? [];
  const primary = projects.filter(project => project.type === 'primary' && project.homepage);
  const galleries = projects.filter(project => project.type === 'gallery' && project.homepage);
  const navPrimary = projects.filter(project => project.type === 'primary' && project.nav);
  const navGalleries = projects.filter(project => project.type === 'gallery' && project.nav);
  const indexHtml = read('index.html');
  const nav = navSections(indexHtml);
  const homepage = homepageSections(indexHtml);

  uniqueValues(projects, 'slug');
  uniqueValues(projects, 'url');

  assertSame('Work dropdown primary order', nav.primary, navPrimary.map(project => project.url));
  assertSame('Work dropdown gallery order', nav.gallery, navGalleries.map(project => project.url));
  validateCards(homepage.primary, primary, 'Homepage primary cards');
  validateCards(homepage.gallery, galleries, 'Homepage gallery cards');
  validateGeneratedContent([...primary, ...galleries]);
  validateProtected(projects);

  notes.push(`Validated ${projects.length} projects from data/projects.json.`);
  notes.push(`Primary order: ${primary.map(project => project.title).join(' > ')}`);
  notes.push(`Gallery order: ${galleries.map(project => project.title).join(' > ')}`);
}

if (errors.length) {
  console.error('Project manifest validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Project manifest validation passed.');
for (const note of notes) console.log(`  ${note}`);
