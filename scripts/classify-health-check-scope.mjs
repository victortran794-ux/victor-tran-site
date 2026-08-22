#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

const emptyScope = () => ({
  all: false,
  shared: false,
  home: false,
  ibm: false,
  pikapp: false,
  gallery: false,
  about: false,
  pci: false,
  sal: false,
  ability: false,
  wxo: false,
  images: false,
  links: false,
  deployable: false,
  design: false,
  docs: false,
});

export function classifyPaths(paths) {
  const scope = emptyScope();
  const isDocumentationPath = path => /^[^/]+\.md$/.test(path);
  const isDesignPath = path =>
    path === 'DESIGN.md' ||
    path === 'content/design-system.md' ||
    path === 'content/design-system.json' ||
    /^scripts\/(?:check-design-md-contract|test-design-md-contract|test-design-md-wiring)\.mjs$/.test(path);
  const isFullSuitePath = path =>
    path === '.github/workflows/health-check.yml' ||
    path === '.github/lighthouse-budget.json' ||
    path === '.github/lighthouse-mobile.json' ||
    path === 'archive/playground.html' ||
    path === 'scripts/classify-health-check-scope.mjs' ||
    path === 'scripts/test-classify-health-check-scope.mjs' ||
    path === 'scripts/check-final-site-reconciliation.mjs' ||
    path === 'scripts/check-lighthouse-coverage.mjs' ||
    path === 'scripts/check-production-artifact-containment.mjs' ||
    path === 'scripts/check-production-host.mjs' ||
    path === 'scripts/health-check.sh' ||
    path === 'scripts/install-lychee.ps1' ||
    path === 'scripts/test-html-to-md.mjs' ||
    path === 'scripts/validate-project-manifest.mjs' ||
    path === 'scripts/preflight.sh' ||
    path === 'package.json' ||
    path === 'package-lock.json';
  const isSharedPath = path =>
    path === '.vercelignore' ||
    path === 'css/style.css' ||
    path === 'js/main.js' ||
    path === 'data/site-shell.json' ||
    path === 'data/projects.json' ||
    path === 'content/site-index.json' ||
    path === 'scripts/generate-site-shell.mjs' ||
    path === 'scripts/generate-project-sections.mjs' ||
    path === 'scripts/generate-responsive-images.py' ||
    path === 'scripts/html-to-md.mjs' ||
    path === 'scripts/check-responsive-images.mjs' ||
    path === 'vercel.json' ||
    path === 'sitemap.xml' ||
    path === 'robots.txt';

  scope.design = paths.some(isDesignPath);
  scope.docs = paths.some(isDocumentationPath) || scope.design;
  scope.all = paths.some(isFullSuitePath);
  scope.shared = paths.some(isSharedPath);

  const routeRules = {
    home: [
      /^(?:index\.html|content\/design-system\.(?:md|json)|content\/(?:vico2-page-system|index)\.md)$/,
      /^scripts\/(?:check-(?:home|route02|design-dna|theme-continuity|global-theme|shared-shell|homepage-system)|test-site-shell)/,
    ],
    ibm: [
      /^(?:ibmcloud|ibm-patterns)\.html$/,
      /^(?:css|js)\/ibm(?:cloud|-patterns)/,
      /^scripts\/check-ibm(?:cloud|-patterns)/,
      /^images\/(?:ibm|patterns)/,
    ],
    pikapp: [
      /^pikappapp(?:\.html|\/)/,
      /^(?:css|js)\/pikappapp/,
      /^scripts\/(?:check|render)-pikapp/,
      /^images\/(?:pikapp|thumb-pikapp)/,
    ],
    gallery: [
      /^(?:artillustration|graphicgallery|uigallery)\.html$/,
      /^css\/ui-gallery\.css$/,
      /^js\/graphicgallery\.js$/,
      /^scripts\/(?:check|build)-(?:gallery|visual-archives|ui-gallery)/,
      /^scripts\/check-public-archive-routes\.mjs$/,
      /^archive\/pages\/(?:artillustration|graphicgallery)-[^/]+\/(?:artillustration|graphicgallery)\.html$/,
      /^images\/(?:ui-gallery|art|graphic)/,
    ],
    about: [
      /^about\.html$/,
      /^content\/about\.md$/,
      /^scripts\/(?:check|test)-about/,
      /^scripts\/about-browser-process\.mjs$/,
      /^images\/(?:about|vic-)/,
    ],
    pci: [
      /^pci\.html$/,
      /^css\/pci-/,
      /^scripts\/check-pci/,
      /^images\/(?:pci|responsive\/pci)/,
    ],
    sal: [
      /^salmagazine\.html$/,
      /^content\/salmagazine\.md$/,
      /^scripts\/check-sal/,
      /^images\/(?:sal-|thumb-sal)/,
    ],
    ability: [
      /^abilityexperience\.html$/,
      /^scripts\/check-ability/,
      /^images\/(?:ability|abex|thumb-abex)/,
    ],
    wxo: [
      /^(?:wxo-canvas|wxo-access|document-processing)\.html$/,
      /^(?:css\/password-gate\.css|js\/wxo-)/,
      /^(?:middleware\.ts|api\/wxo-access\.mjs|lib\/(?:protected-(?:access|middleware)|password-verifier)\.mjs)$/,
      /^scripts\/(?:check-wxo|test-protected-delivery)/,
      /^images\/wxo-canvas/,
      /^protected\/wxo\//,
      /^case-studies\/document-processing\.md$/,
    ],
  };

  for (const [route, patterns] of Object.entries(routeRules)) {
    scope[route] = paths.some(path => patterns.some(pattern => pattern.test(path)));
  }

  scope.images = paths.some(path => path.startsWith('images/'));

  const isDeployablePath = path =>
    /^[^/]+\.html$/.test(path) ||
    /^(?:css|js|images|pikappapp|protected\/wxo)\//.test(path) ||
    /^(?:middleware\.ts|api\/wxo-access\.mjs|lib\/(?:protected-(?:access|middleware)|password-verifier)\.mjs)$/.test(path) ||
    /^data\/(?:projects|site-shell|content-export-policy)\.json$/.test(path) ||
    path === 'vercel.json' ||
    path === 'sitemap.xml' ||
    path === 'robots.txt';
  const deployable = paths.some(isDeployablePath);
  scope.deployable = scope.deployable || deployable;
  scope.links = scope.links || deployable;

  const routeSelected = Object.keys(routeRules).some(route => scope[route]);
  const unknownDeployable = deployable && !routeSelected && !scope.shared && !scope.all;
  if (unknownDeployable || paths.some(path => path.startsWith('images/responsive/'))) {
    scope.shared = true;
  }

  const hasUnknownPath = paths.some(path =>
    !isDocumentationPath(path) &&
    !isDesignPath(path) &&
    !isFullSuitePath(path) &&
    !isSharedPath(path) &&
    !isDeployablePath(path) &&
    !Object.values(routeRules).some(patterns => patterns.some(pattern => pattern.test(path)))
  );
  if (hasUnknownPath) scope.all = true;

  if (scope.all || scope.shared) {
    scope.links = true;
    scope.deployable = true;
  }

  return scope;
}

export function forceAllScopes() {
  return Object.fromEntries(Object.keys(emptyScope()).map(key => [key, true]));
}

export function formatScopeOutputs(scope) {
  return `${Object.entries(scope).map(([key, value]) => `${key}=${value}`).join('\n')}\n`;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  let scope;
  if (process.argv.includes('--all')) {
    scope = forceAllScopes();
  } else {
    let input = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) input += chunk;
    const paths = input.split(/[\0\r\n]+/).map(path => path.trim()).filter(Boolean);
    scope = classifyPaths(paths);
  }
  process.stdout.write(formatScopeOutputs(scope));
}
