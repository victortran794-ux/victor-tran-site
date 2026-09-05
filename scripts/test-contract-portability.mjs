#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const contracts = [
  'scripts/check-pci-cover-source.mjs',
  'scripts/check-graphic-heading-browser.mjs',
];
const forbiddenAbsolutePath = /\/(?:home\/|mnt\/c\/Users\/)/u;

for (const contract of contracts) {
  const source = fs.readFileSync(path.resolve(contract), 'utf8');
  assert.doesNotMatch(
    source,
    forbiddenAbsolutePath,
    `${contract} must not contain a local absolute /home/ or /mnt/c/Users/ path`,
  );
}

console.log('Portable PCI and Graphic contract path fixture passed.');
