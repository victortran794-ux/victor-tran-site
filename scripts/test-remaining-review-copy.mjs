import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const cases = [
  ['wxo-canvas.html', 'Each feature added more types of work to the canvas. I helped keep nodes, states, and connections consistent as the builder expanded.', 'The challenge was not a single screen.'],
  ['document-processing.html', 'The screens use fictional sample data. The values shown are examples, not measured product results.', 'unaltered owner exports'],
  ['pikappapp.html', 'The later V2 study revisits the original member flow with a navy-and-gold palette and updated typography, spacing, and controls.', 'The later V2 direction keeps the original cyan field'],
  ['pci.html', 'Freelance publication and environmental design for PCI, applying its existing brand to an employee handbook and recruitment concepts.', 'top national specialty contractor'],
  ['abilityexperience.html', 'An anniversary mark, iconography, a commemorative print, and cycling kits.', 'A connected identity system carried'],
  ['salmagazine.html', '“The Challenge We Must Face” takes a hard look at the fraternity in the wake of a brother’s death.', '"The Challenge We Must Face." takes'],
  ['artillustration.html', 'Digital and traditional work spanning character illustration, paintings, and personal series.', null],
  ['graphicgallery.html', 'Identity, print, presentation, illustration, and event work from side projects, explorations, and collaborations.', null],
];

for (const [file, expected, retired] of cases) {
  const text = read(file);
  assert.ok(text.includes(expected), `${file}: reviewed copy is missing`);
  if (retired) assert.ok(!text.includes(retired), `${file}: superseded copy remains`);
}

const generator = read('scripts/build-visual-archives-integration.py');
assert.ok(generator.includes('Digital and traditional work spanning character illustration, paintings, and personal series.'), 'gallery generator must own Art lede');
assert.ok(generator.includes('Identity, print, presentation, illustration, and event work from side projects, explorations, and collaborations.'), 'gallery generator must own Graphic lede');
console.log(`PASS: ${cases.length} remaining review copy contracts`);
