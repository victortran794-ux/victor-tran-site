import fs from 'node:fs';
import assert from 'node:assert/strict';
const items = JSON.parse(fs.readFileSync(new URL('./portfolio-review-copy.json', import.meta.url)));
for (const item of items) {
 const text = fs.readFileSync(new URL(`../${item.file}`, import.meta.url), 'utf8');
 assert.ok(text.includes(item.new), `${item.id}: expected reviewed copy in ${item.file}`);
 if (!item.new.includes(item.old)) assert.ok(!text.includes(item.old), `${item.id}: superseded copy remains in ${item.file}`);
}
const projects = JSON.parse(fs.readFileSync(new URL('../data/projects.json', import.meta.url))).projects;
assert.equal(projects.find(p => p.slug === 'wxo-canvas').homepageBonus, 'Includes Document Processing', 'HOME-C03: manifest must preserve reviewed bonus copy on regeneration');
assert.equal(projects.find(p => p.slug === 'salmagazine').description, 'Five years of editorial design and art direction for Pi Kappa Phi’s century-old magazine.', 'HOME-C05: manifest must preserve reviewed magazine copy on regeneration');
console.log(`PASS: ${items.length} reviewed copy assertions and homepage source ownership`);
