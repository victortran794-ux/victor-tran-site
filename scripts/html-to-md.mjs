import fs from 'node:fs';
import path from 'node:path';

const PAGES = [
  'index.html',
  'about.html',
  'document-processing.html',
  'wxo-canvas.html',
  'ibmcloud.html',
  'ibm-patterns.html',
  'pikappapp.html',
  'pci.html',
  'abilityexperience.html',
  'salmagazine.html',
  'graphicgallery.html',
  'artillustration.html',
  'uigallery.html',
];

function parseArgs(argv) {
  const args = { root: process.cwd(), mode: 'public' };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--root requires a path');
      args.root = path.resolve(value);
      index += 1;
    } else if (arg === '--mode') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--mode requires public or private');
      args.mode = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['public', 'private'].includes(args.mode)) {
    throw new Error(`Unsupported mode: ${args.mode}. Use public or private.`);
  }

  return args;
}

const GENERATED_NOTICE = `<!--
Generated file. Do not edit directly.
Source: ../{source}
Regenerate with: node scripts/html-to-md.mjs
-->
`;

function decodeEntities(value = '') {
  const entities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '-',
    mdash: '-',
    hellip: '...',
    copy: '(c)',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, key) => entities[key.toLowerCase()] ?? `&${key};`);
}

function stripTags(value = '') {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|header|li|dt|dd|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeText(value = '') {
  return stripTags(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttribute(tag, attr) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  const value = match?.[1] ?? match?.[2] ?? '';
  return decodeEntities(value.trim());
}

function firstMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? normalizeText(match[1]) : '';
}

function allMatches(html, pattern) {
  return Array.from(html.matchAll(pattern), match => normalizeText(match[1])).filter(Boolean);
}

function slugFromFile(file) {
  return file.replace(/\.html$/, '');
}

function urlFromFile(file) {
  return file === 'index.html' ? '/' : `/${slugFromFile(file)}`;
}

function canonicalProjectUrl(href) {
  return href.split(/[?#]/, 1)[0].replace(/\.html$/, '');
}

function contentFileFromHtml(file) {
  return `${slugFromFile(file)}.md`;
}

function removeSiteChrome(html) {
  return html
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<div class="cursor-dot"[\s\S]*?<\/div>/gi, '')
    .replace(/<div class="cursor-ring"[\s\S]*?<\/div>/gi, '')
    .replace(/<div class="dna-overlay"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
}

function extractImages(html) {
  const images = [];

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = getAttribute(tag, 'src');
    const alt = getAttribute(tag, 'alt');

    if (!src || !alt) continue;
    if (src.includes('favicon') || src.includes('apple-touch-icon') || src.includes('nav-logo')) continue;

    images.push({ src, alt });
  }

  return dedupeBy(images, item => `${item.src}|${item.alt}`);
}

function extractParagraphs(html) {
  const paragraphs = [];

  for (const match of html.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
    const tag = match[0].match(/<p\b[^>]*>/i)?.[0] ?? '';
    const className = getAttribute(tag, 'class');

    if (
      className.includes('section-label') ||
      className.startsWith('footer-') ||
      className.startsWith('lb-') ||
      className.startsWith('marquee') ||
      className.startsWith('nav-')
    ) {
      continue;
    }

    const text = normalizeText(match[0]);
    if (text) paragraphs.push(text);
  }

  return dedupeBy(paragraphs, item => item);
}

function extractMetaItems(html) {
  const items = [];

  for (const block of html.matchAll(/<div class="case-study-meta-item">([\s\S]*?)<\/div>/gi)) {
    const dt = firstMatch(block[1], /<dt[^>]*>([\s\S]*?)<\/dt>/i);
    const dd = firstMatch(block[1], /<dd[^>]*>([\s\S]*?)<\/dd>/i);

    if (dt && dd) items.push({ label: dt, value: dd });
  }

  return items;
}

function extractHomeProjects(html) {
  const projects = [];
  const linkPattern = /<a\s+href="([^"]+)"\s+class="(?:project-card|featured-item)[^"]*"[\s\S]*?<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const block = match[0];
    const title = firstMatch(block, /<(?:h2|h3)[^>]*class="(?:project-card-title|featured-item-title)[^"]*"[^>]*>([\s\S]*?)<\/(?:h2|h3)>/i);
    const category = firstMatch(block, /<p[^>]*class="section-label[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const imgTag = block.match(/<img\b[^>]*>/i)?.[0] ?? '';
    const image = getAttribute(imgTag, 'src');
    const alt = getAttribute(imgTag, 'alt');

    if (title) {
      projects.push({
        title,
        category,
        url: canonicalProjectUrl(match[1]),
        image,
        alt,
      });
    }
  }

  return projects;
}

function dedupeBy(items, getKey) {
  const seen = new Set();
  return items.filter(item => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function yamlString(value) {
  return `"${String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function protectedPageToMarkdown() {
  return `<!-- Generated protected-content stub. Do not edit directly. -->

# Protected case study

This case study is password-protected. Contact Victor Tran to request access.
`;
}

function pageToMarkdown(file, html) {
  const cleanHtml = removeSiteChrome(html);
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*·\s*Victor Tran Design$/, '');
  const description =
    firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i) ||
    firstMatch(html, /<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i);
  const h1 = firstMatch(cleanHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || title;
  const category = file === 'index.html'
    ? 'Portfolio'
    : firstMatch(cleanHtml, /<p[^>]*class="section-label[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  const pageIntro = firstMatch(cleanHtml, /<p[^>]*class="page-header-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  const metaItems = extractMetaItems(cleanHtml);
  const headingPattern = file === 'about.html'
    ? /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi
    : /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const headings = dedupeBy(allMatches(cleanHtml, headingPattern), item => item);
  const paragraphs = extractParagraphs(cleanHtml);
  const listItems = dedupeBy(allMatches(cleanHtml, /<li\b[^>]*>([\s\S]*?)<\/li>/gi), item => item)
    .filter(item => !['Home', 'About', 'Contact', 'Work', 'Galleries'].includes(item));
  const tags = dedupeBy(allMatches(cleanHtml, /<span[^>]*class="tag[^"]*"[^>]*>([\s\S]*?)<\/span>/gi), item => item);
  const images = extractImages(cleanHtml);
  const homeProjects = file === 'index.html' ? extractHomeProjects(cleanHtml) : [];

  const frontmatter = [
    '---',
    `title: ${yamlString(h1 || title)}`,
    `source: ${yamlString(file)}`,
    `url: ${yamlString(urlFromFile(file))}`,
    `category: ${yamlString(category)}`,
    `description: ${yamlString(description)}`,
    '---',
    '',
  ].join('\n');

  const body = [];
  body.push(GENERATED_NOTICE.replace('{source}', file).trim());
  body.push('');
  body.push(frontmatter.trim());
  body.push('');
  body.push(`# ${h1 || title}`);
  body.push('');

  if (description) {
    body.push('## Description');
    body.push('');
    body.push(description);
    body.push('');
  }

  if (pageIntro && pageIntro !== description) {
    body.push('## Page Intro');
    body.push('');
    body.push(pageIntro);
    body.push('');
  }

  if (category || metaItems.length) {
    body.push('## Metadata');
    body.push('');
    if (category) body.push(`- Category: ${category}`);
    for (const item of metaItems) body.push(`- ${item.label}: ${item.value}`);
    body.push('');
  }

  if (homeProjects.length) {
    body.push('## Featured Projects');
    body.push('');
    for (const project of homeProjects) {
      body.push(`- ${project.title}${project.category ? ` (${project.category})` : ''}: ${project.url}`);
    }
    body.push('');
  }

  if (headings.length) {
    body.push('## Section Headings');
    body.push('');
    for (const heading of headings) body.push(`- ${heading}`);
    body.push('');
  }

  if (paragraphs.length) {
    body.push('## Body Copy');
    body.push('');
    for (const paragraph of paragraphs) {
      if (paragraph === pageIntro || paragraph === description) continue;
      body.push(paragraph);
      body.push('');
    }
  }

  if (listItems.length || tags.length) {
    body.push('## Lists And Tags');
    body.push('');
    for (const item of [...listItems, ...tags]) body.push(`- ${item}`);
    body.push('');
  }

  if (images.length) {
    body.push('## Images');
    body.push('');
    for (const image of images) body.push(`- ${image.alt}: ${image.src}`);
    body.push('');
  }

  return {
    markdown: `${body.join('\n').replace(/\n{4,}/g, '\n\n\n').trim()}\n`,
    summary: {
      title: h1 || title,
      source: file,
      url: urlFromFile(file),
      category,
      description,
      contentFile: `content/${contentFileFromHtml(file)}`,
      headings,
      images: images.slice(0, 12),
      projects: homeProjects,
    },
  };
}

function main() {
  const { root, mode } = parseArgs(process.argv.slice(2));
  const policyPath = path.join(root, 'data', 'content-export-policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const protectedPages = new Map(
    policy.protectedPages.map(item => [item.source, item])
  );
  const pageFiles = [...new Set([...PAGES, ...protectedPages.keys()])];
  const outputName = mode === 'public' ? 'content' : '.private-content';
  const outputDir = path.join(root, outputName);

  fs.mkdirSync(outputDir, { recursive: true });

  const index = [];

  for (const file of pageFiles) {
    const sourcePath = path.join(root, file);
    if (!fs.existsSync(sourcePath)) {
      if (!protectedPages.get(file)?.provisional) {
        console.warn(`Skipping missing page: ${file}`);
      }
      continue;
    }

    const html = fs.readFileSync(sourcePath, 'utf8');
    const pagePolicy = protectedPages.get(file);
    const outputFile = pagePolicy ? `${pagePolicy.slug}.md` : contentFileFromHtml(file);
    const outputPath = path.join(outputDir, outputFile);

    if (mode === 'public' && pagePolicy) {
      fs.writeFileSync(outputPath, protectedPageToMarkdown(), 'utf8');
      continue;
    }

    const { markdown, summary } = pageToMarkdown(file, html);
    summary.contentFile = `${outputName}/${outputFile}`;

    fs.writeFileSync(outputPath, markdown, 'utf8');
    index.push(summary);
  }

  fs.writeFileSync(
    path.join(outputDir, 'site-index.json'),
    `${JSON.stringify(index, null, 2)}\n`,
    'utf8'
  );

  console.log(`Generated ${index.length} indexed Markdown files in ${outputName}/ (${mode} mode).`);
}

main();
