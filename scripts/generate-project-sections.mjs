#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'data', 'projects.json');
const indexPath = path.join(root, 'index.html');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projects = manifest.projects ?? [];
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const projectHref = (project) => project.entryUrl || project.url;

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
  if (project.homepageOverlay) classes.push('featured-item--overlay');
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
    const themeAttrs = image.themeDarkSrc
      ? ` data-home-theme-image data-theme-light-src="${escapeHtml(image.src)}" data-theme-dark-src="${escapeHtml(image.themeDarkSrc)}"`
      : '';
    return `${imageIndent}<img loading="lazy" decoding="async"${classAttr}${themeAttrs}\n${attrIndent}src="${escapeHtml(image.src)}"${srcsetAttr}${sizesAttr} width="${image.width}" height="${image.height}"\n${attrIndent}alt="${escapeHtml(image.alt)}"\n${imageIndent}>`;
  }).join('\n');
}

function cardMarkup(project, indent = '        ') {
  const labelClass = project.labelClass || 'label-default';
  const homepageLabel = project.homepageLabel === false ? '' : (project.homepageLabel || project.category);
  const labelMarkup = homepageLabel
    ? `${indent}    <p class="section-label ${escapeHtml(labelClass)}">${escapeHtml(homepageLabel)}</p>\n`
    : '';
  const lock = project.homepageLock
    ? ' <span class="featured-item-lock" role="img" aria-label="Password required"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg></span>'
    : '';
  const practiceMarkup = project.homepagePractice
    ? `${indent}    <p class="featured-practice"><span>Current practice</span><strong>${escapeHtml(project.homepagePractice.role)}</strong><span>${escapeHtml(project.homepagePractice.focus)}</span><span>${escapeHtml(project.homepagePractice.location)}</span></p>\n`
    : '';
  const viewLink = `<span class="view-link">${escapeHtml(project.cta ?? 'View Project')}</span>`;
  const bonusMarkup = project.homepageBonus
    ? `<span class="featured-item-bonus"><span aria-hidden="true">↳</span><em>${escapeHtml(project.homepageBonus)}</em></span>`
    : '';
  const cardBody = `${indent}  <div class="featured-item-img">\n${imageMarkup(project, indent)}\n${indent}  </div>\n${indent}  <div class="featured-item-content">\n${labelMarkup}${indent}    <h2 class="featured-item-title">${escapeHtml(project.title)}${lock}</h2>\n${practiceMarkup}${indent}    <p class="featured-item-desc">${escapeHtml(project.description)}</p>\n${indent}    <div class="featured-card-actions">${viewLink}${bonusMarkup}</div>\n${indent}  </div>`;
  return `${indent}<a href="${escapeHtml(projectHref(project))}" class="${projectClass(project)}" data-chapter="${escapeHtml(project.chapter)}" data-chapter-title="${escapeHtml(project.chapterTitle)}">\n${cardBody}\n${indent}</a>`;
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

const homepagePrimary = projects.filter(project => project.type === 'primary' && project.homepage);
const homepageGalleries = projects.filter(project => project.type === 'gallery' && project.homepage);

const primaryBody = homepagePrimary.map(project => cardMarkup(project)).join('\n\n');
const galleryBody = homepageGalleries.map(project => cardMarkup(project, '          ')).join('\n\n');

let output = indexHtml;
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
  console.log('Generated homepage project sections from data/projects.json.');
}
