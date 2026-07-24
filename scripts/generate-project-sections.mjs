#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'data', 'projects.json');
const indexPath = path.join(root, 'index.html');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projects = manifest.projects ?? [];
const indexHtml = fs.readFileSync(indexPath, 'utf8');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function projectClass(project) {
  const classes = ['featured-item'];
  if (project.type === 'gallery') classes.push('featured-item--gallery');
  if (project.wide) classes.push('featured-item--wide');
  if (project.homepageVariant) classes.push(`featured-item--${project.homepageVariant}`);
  if (project.surface) classes.push(`featured-item--surface-${project.surface}`);
  classes.push('reveal');
  return classes.join(' ');
}

function imageMarkup(project, indent) {
  const imageIndent = `${indent}    `;
  const attrIndent = `${indent}      `;
  return (project.images ?? []).map(image => {
    const classAttr = image.class ? ` class="${escapeHtml(image.class)}"` : '';
    const srcsetAttr = image.srcset ? `\n${attrIndent}srcset="${escapeHtml(image.srcset)}"` : '';
    const sizesAttr = image.sizes ? `\n${attrIndent}sizes="${escapeHtml(image.sizes)}"` : '';
    return `${imageIndent}<img loading="lazy" decoding="async"${classAttr}\n${attrIndent}src="${escapeHtml(image.src)}"${srcsetAttr}${sizesAttr} width="${image.width}" height="${image.height}"\n${attrIndent}alt="${escapeHtml(image.alt)}"\n${imageIndent}>`;
  }).join('\n');
}

function cardMarkup(project, indent = '        ') {
  const labelClass = project.labelClass || 'label-default';
  return `${indent}<a href="${escapeHtml(project.url)}" class="${projectClass(project)}" data-chapter="${escapeHtml(project.chapter)}" data-chapter-title="${escapeHtml(project.chapterTitle)}">\n${indent}  <div class="featured-item-img">\n${imageMarkup(project, indent)}\n${indent}  </div>\n${indent}  <div class="featured-item-content">\n${indent}    <p class="section-label ${escapeHtml(labelClass)}">${escapeHtml(project.category)}</p>\n${indent}    <h2 class="featured-item-title">${escapeHtml(project.title)}</h2>\n${indent}    <p class="featured-item-desc">${escapeHtml(project.description)}</p>\n${indent}    <span class="view-link">${escapeHtml(project.cta ?? 'View Project')}</span>\n${indent}  </div>\n${indent}</a>`;
}

function chapterMarkerMarkup(project, indent = '        ') {
  return `${indent}<header class="featured-chapter" data-chapter-marker="${escapeHtml(project.chapter)}">\n${indent}  <span>${escapeHtml(project.chapter)}</span>\n${indent}  <h3>${escapeHtml(project.chapterTitle)}</h3>\n${indent}</header>`;
}

function cardsWithChapterMarkers(items, indent = '        ') {
  let previousChapter = null;
  return items.flatMap(project => {
    const fragments = [];
    if (project.chapter !== previousChapter) {
      fragments.push(chapterMarkerMarkup(project, indent));
      previousChapter = project.chapter;
    }
    fragments.push(cardMarkup(project, indent));
    return fragments;
  }).join('\n\n');
}

function navItem(project, indent = '            ') {
  return `${indent}<li role="none"><a role="menuitem" href="${escapeHtml(project.url)}">${escapeHtml(project.title)}</a></li>`;
}

function generatedBlock(name, body, indent = '') {
  return `${indent}<!-- generated:${name}:start -->\n${body}\n${indent}<!-- generated:${name}:end -->`;
}

function replaceOrCreate(html, name, fallbackPattern, body, indent = '') {
  const markerPattern = new RegExp(`${indent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<!-- generated:${name}:start -->[\\s\\S]*?${indent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<!-- generated:${name}:end -->`);
  const block = generatedBlock(name, body, indent);
  if (markerPattern.test(html)) return html.replace(markerPattern, block);
  return html.replace(fallbackPattern, block);
}

const navPrimary = projects.filter(project => project.type === 'primary' && project.nav);
const navGalleries = projects.filter(project => project.type === 'gallery' && project.nav);
const homepagePrimary = projects.filter(project => project.type === 'primary' && project.homepage);
const homepageGalleries = projects.filter(project => project.type === 'gallery' && project.homepage);

const navBody = [
  ...navPrimary.map(project => navItem(project)),
  '            <li class="nav-dropdown-separator" role="separator" aria-hidden="true"></li>',
  ...navGalleries.map(project => navItem(project)),
].join('\n');

const primaryBody = cardsWithChapterMarkers(homepagePrimary);
const galleryBody = homepageGalleries.map(project => cardMarkup(project, '          ')).join('\n\n');

let output = indexHtml;
output = replaceOrCreate(
  output,
  'projects-nav',
  /            <li role="none"><a role="menuitem" href="document-processing\.html">Document Processing<\/a><\/li>[\s\S]*?            <li role="none"><a role="menuitem" href="graphicgallery\.html">Graphic Design<\/a><\/li>/,
  navBody,
  '            ',
);
output = replaceOrCreate(
  output,
  'homepage-primary-projects',
  /        <a href="document-processing\.html" class="featured-item featured-item--wide reveal"[\s\S]*?        <\/a>\s*\n\s*\n\s*        <a href="ibmcloud\.html"[\s\S]*?        <\/a>\s*\n\s*\n\s*        <a href="ibm-patterns\.html"[\s\S]*?        <\/a>\s*\n\s*\n\s*        <a href="pci\.html"[\s\S]*?        <\/a>\s*\n\s*\n\s*        <a href="abilityexperience\.html"[\s\S]*?        <\/a>\s*\n\s*\n\s*        <a href="salmagazine\.html"[\s\S]*?        <\/a>\s*\n\s*\n\s*        <a href="pikappapp\.html"[\s\S]*?        <\/a>/,
  primaryBody,
  '        ',
);
output = replaceOrCreate(
  output,
  'homepage-gallery-projects',
  /          <a href="artillustration\.html" class="featured-item featured-item--gallery featured-item--surface-orange reveal"[\s\S]*?          <\/a>\s*\n\s*\n\s*          <a href="graphicgallery\.html"[\s\S]*?          <\/a>/,
  galleryBody,
  '          ',
);

if (output === indexHtml) {
  console.log('Project sections already up to date.');
} else {
  fs.writeFileSync(indexPath, output);
  console.log('Generated Work dropdown and homepage project sections from data/projects.json.');
}
