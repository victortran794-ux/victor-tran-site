#!/usr/bin/env node
import fs from 'node:fs';

const html = fs.readFileSync('salmagazine.html', 'utf8');
const expected = [
  ['Fall 2016', 'starandlamp_fall16_issuu'],
  ['Summer 2017', 'star_lamp_sum2017_online'],
  ['Winter 2017', 'starandlamp_fall17_issuu'],
  ['Summer 2018', 's_l_spr2018'],
  ['Fall 2018', 's_l_fal2018_issuu'],
  ['Summer 2019', 'issuu_s_l_spr2019'],
  ['Fall 2019', 's_l_fal2019_issuu'],
  ['Summer 2020', 's_l_spr2020_digital__4_'],
  ['Fall 2020', 's_l_fall2020_final_proof'],
];
const wall = html.match(/<div class="sal-vico2-cover-wall[^"]*">([\s\S]*?)<\/div>/)?.[1] ?? '';
const cards = [...wall.matchAll(/<a href="([^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span><\/a>/g)]
  .map(([, href, label]) => [label.trim(), href]);
const expectedCards = expected.map(([label, slug]) => [label, `https://issuu.com/pikappaphi/docs/${slug}`]);
const failures = [];
if (JSON.stringify(cards) !== JSON.stringify(expectedCards)) failures.push(`issue card mapping differs: ${JSON.stringify(cards)}`);
if (!/class="sal-vico2-archive-link" href="https:\/\/issuu\.com\/pikappaphi"/.test(html)) failures.push('separate all-issues archive CTA must remain');
if (failures.length) {
  console.error('Star & Lamp issue archive contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Star & Lamp issue archive contract passed (nine official documents and archive CTA).');
