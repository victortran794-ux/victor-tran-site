#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const cloud = read('ibmcloud.html');
const css = read('css/ibmcloud-hiring.css');
const patterns = read('ibm-patterns.html');
const failures = [];
const require = (condition, message) => { if (!condition) failures.push(message); };

for (const [id, text] of [
  ['CLD-C04', 'Start with subscription details'],
  ['CLD-C05', 'Add another condition'],
  ['CLD-C10', 'These sketches explore service metaphors and composition.'],
  ['CLD-C11', 'The foundations define shared rules for geometry, color, gradients, and lighting.'],
  ['CLD-C12', 'Five services, each shown in light and dark themes.'],
  ['CLD-C14', 'These service icons use the same geometry and color palette.'],
]) require(cloud.includes(text), `${id} missing approved copy: ${text}`);
for (const text of [
  'Proposed and concept-tested, not evidence of shipment or measured impact.',
  'I created most of the original product illustrations and reusable components, then partnered with the team to document and scale the method.',
]) require(cloud.includes(text), `Cloud claim boundary drifted: ${text}`);
const serviceLabels = ['Code Engine', 'Container Registry', 'Satellite', 'IBM Cloud Kubernetes Service', 'Red Hat OpenShift on IBM Cloud'];
for (const label of serviceLabels) require(cloud.includes(`<span class="ibm-theme-pair-label">${label}</span>`), `CLD-C12 missing visible service label: ${label}`);
require((cloud.match(/class="ibm-theme-pair-label"/g) || []).length === 5, 'CLD-C12 requires exactly five visible service labels');
require(css.includes('[data-project="ibm-cloud"] .ibm-theme-pair-label'), 'CLD-C12 requires route-scoped service-label styles');
require(/@media \(max-width: 720px\)[\s\S]*?\.ibm-theme-pair\s*\{[\s\S]*?grid-template-columns:\s*1fr/.test(css), 'CLD-C12 requires mobile theme-pair stacking');

for (const [id, text] of [
  ['PAT-C08', 'The old experience offered little guidance to people who were new to IBM or unsure where to take a question.'],
  ['PAT-C10', 'We combined sponsor-user interviews, competitor analysis, and search data. Two problems stood out.'],
  ['PAT-C11', 'The old page pairs a long list of destinations with a general contact form.'],
  ['PAT-C12', 'Support destinations were difficult to distinguish, so inquiries could reach the wrong team.'],
  ['PAT-C13', 'Help options varied across product pages.'],
  ['PAT-C14', 'We shifted the emphasis from a general form to clear choices about where to go next.'],
  ['PAT-C15', 'The concept brings support, sales, learning, and other routes forward, with contact options for people who still need help.'],
  ['PAT-C16', 'The goal was to get people closer to the right information or person.'],
  ['PAT-C17', 'These explorations show how the team moved from a directory to grouped choices, direct contact routes, and an option to reach a person.'],
  ['PAT-C18', 'This version makes the destinations explicit in a directory.'],
  ['PAT-C19', 'Topic cards guide the choices, with a general contact form below.'],
  ['PAT-C20', 'This version groups more destinations and provides direct contact options.'],
  ['PAT-C21', 'Team explorations from our February 23, 2021 presentation; individual screen authorship is not attributed.'],
  ['PAT-C22', 'I remember wanting the page to feel warmer and more helpful.'],
  ['PAT-C23', 'The image of two people working together supports the invitation: “We\'re here to help.”'],
  ['PAT-C24', 'Hero concept | We\'re here for you'],
  ['PAT-C26', 'Both headlines address the visitor directly and offer help.'],
  ['PAT-C27', 'The concept groups support, sales, careers, learning, partners, and general inquiries into recognizable choices.'],
  ['PAT-C28', 'Contact information and assisted routes remain available when self-service is not enough.'],
  ['PAT-C30', 'Sales routes at a glance'],
  ['PAT-C31', 'Six cards organize the sales destinations by topic.'],
  ['PAT-C32', 'Careers and learning sit alongside support and sales in the same navigation.'],
  ['PAT-C33', "Help when the choices aren't enough"],
  ['PAT-C34', 'General inquiries, support, and sales remain available at the end of the page.'],
  ['PAT-C35', 'Our final presentation connected the research to the routing and interface decisions.'],
  ['PAT-C36', 'Final presentation | The Saga To-Be'],
  ['PAT-C37', 'Bradley and Paige returned in the To-Be chapter to introduce the proposed experience.'],
  ['PAT-C40', 'Paraphrased from private program feedback.'],
]) require(patterns.includes(text), `${id} missing approved copy: ${text}`);
for (const text of [
  'This was collaborative work.',
  'Similarity in later versions does not prove exact lineage, sole authorship, or direct implementation.',
]) require(patterns.includes(text), `Patterns claim boundary drifted: ${text}`);
for (const retired of [
  'someone who was new, smaller',
  'Google 360 and IBM internal-search data',
  'Humanization rationale',
]) require(!patterns.includes(retired), `Patterns retired copy remains: ${retired}`);

if (failures.length) {
  console.error('CLOUD + PATTERNS COPY GUARD: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('CLOUD + PATTERNS COPY GUARD: PASS cloud=6 patterns=28 holds=5');
