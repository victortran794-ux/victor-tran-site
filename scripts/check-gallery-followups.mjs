#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const expect=(value,message)=>{if(!value)failures.push(message)};
const read=(file)=>fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file),'utf8'):'';
const count=(value,needle)=>value.split(needle).length-1;

const generator=read('scripts/build-visual-archives-integration.py');
const daysignsBuilder=read('scripts/build-daysigns-gallery-assets.py');
const art=read('artillustration.html');
const ui=read('uigallery.html');
const uiContract=read('scripts/check-ui-gallery-integration.mjs');
const packageJson=JSON.parse(read('package.json')||'{"scripts":{}}');
const preflight=read('scripts/preflight.sh');
const activeVisitorPages=['index.html','about.html','ibmcloud.html','ibm-patterns.html','pci.html','abilityexperience.html','salmagazine.html','pikappapp.html','artillustration.html','graphicgallery.html','uigallery.html','wxo-canvas.html','document-processing.html','wxo-access.html'];
const daysignsHashes={
  'daysign-03.webp':'88de877a24b3c080064fb74d4d3b5c11aac7931a05d6682de99a59080aae9706',
  'daysign-04.webp':'c059caa9848bf9dbc4f25b5f63612cba432c3e4400017239396c3e0343405379',
  'daysign-05.webp':'24e2dfa3a91387c363949653c61028771919bb86b88e1bba333d0eba88fd0cbd',
  'daysign-06.webp':'74e57b4afa295b298dd7fe7096d188a7a2fdbab85df415b5df9633f30ae0d25d',
  'daysign-07.webp':'5fbef8632bf8574b5396df21229b3a6fbb796d3545af8ba71530e9fa52b7102e',
  'daysign-08.webp':'ce2d78e87c4b8b81b21a469e062ad0d0fe8f3f706be73b35e113983f2fa2b636',
  'daysign-10.webp':'f97387af6c097110c09fa421d3b31627102d733d654acfc327f0aed729c629e2',
  'daysign-11.webp':'c429033b691adca7466f7e31f14e52233dddb3a752174db68e39070b031162f3',
  'daysign-12.webp':'0d1293f8513ba4cde7113b29358ca8330034a4251f142df7baa8d9c43652b5cf',
  'daysign-13.webp':'b1ef48df1bafda484f8c0549ef85029d181f3667356ddd5200a9657ac88b4925',
};

expect(daysignsBuilder.includes('DAYSIGNS_GALLERY_SOURCE'),'Daysigns builder must support a portable source environment variable');
for(const number of [3,4,5,6,7,8,10,11,12,13]){
  const source=`${number}-private-preview.png`;
  const output=`daysign-${String(number).padStart(2,'0')}.webp`;
  expect(daysignsBuilder.includes(source),`Daysigns builder missing source ${source}`);
  expect(daysignsBuilder.includes(output),`Daysigns builder missing output ${output}`);
  expect(art.includes(`images/daysigns/${output}`),`Art page missing ${output}`);
}
for(const excluded of [1,2,9,14]){
  expect(!art.includes(`images/daysigns/daysign-${String(excluded).padStart(2,'0')}.webp`),`Excluded Daysigns ${excluded} entered public page`);
}
for(const [name,expectedHash] of Object.entries(daysignsHashes)){
  const assetPath=path.join(root,'images','daysigns',name);
  expect(fs.existsSync(assetPath),`Missing approved Daysigns derivative: ${name}`);
  if(fs.existsSync(assetPath)){
    const actualHash=createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex');
    expect(actualHash===expectedHash,`Daysigns derivative hash drifted: ${name}`);
  }
}

expect(generator.includes('id="art-daysigns-title"'),'Canonical Art generator must own the Daysigns section');
expect(generator.includes('class="art-daysigns-grid"'),'Canonical Art generator must own the Daysigns grid');
expect(count(art,'data-daysigns-item')===10,`Art page must contain exactly 10 Daysigns items; found ${count(art,'data-daysigns-item')}`);
expect(art.includes('<h2 id="art-daysigns-title">Daysigns</h2>'),'Art page must use the Daysigns heading');
expect(!art.includes('Personal series')&&!art.includes('Ten geometric illustrations from a numbered personal practice.'),'Daysigns must use only its simple heading without a label or description');
for(const token of [
  '.art-daysigns-grid {',
  'grid-template-columns: repeat(5, minmax(0, 1fr));',
  'gap: 0;',
  'width: min(calc(100% - clamp(4rem, 10vw, 12rem)), 1500px);',
  '.art-daysigns-grid figure { margin: 0; padding: 0;',
  'aspect-ratio: 1 / 1;',
  'object-fit: cover;',
  '@media (max-width: 720px)',
  '.art-daysigns-grid { grid-template-columns: repeat(2, minmax(0, 1fr));',
]) expect(generator.includes(token),`Daysigns generator CSS missing: ${token}`);

const ekosCopy='A high-fidelity refinement of an original client landing-page concept from 2018. The concept was not shipped; registration and booking are illustrative.';
expect(ui.includes('<h2 id="ekos-study-title">Ekos Con</h2>'),'Ekos must keep the year only in supporting copy, not the large heading');
expect(!ui.includes('<h2 id="ekos-study-title">Ekos Con 2018</h2>'),'Ekos large heading must not repeat 2018');
expect(ui.includes(ekosCopy),'Ekos summary must include the approved provenance/status clarification');
expect(uiContract.includes(ekosCopy),'UI Gallery contract must lock the Ekos clarification');
expect(count(ui,'data-ui-study-view="magi-')===4,'Magi public edit must remain the four-study owner-approved curation');
expect(!ui.includes('magi-inspector-metrics'),'Redundant Inspector & Metrics board must remain omitted');
expect(uiContract.includes('four retained Magi studies'),'UI Gallery contract must preserve the four-study owner-approved curation');
expect(uiContract.includes('owner-rejected cropped Magi'),'UI Gallery contract must keep the two rejected cropped figures excluded');
expect(packageJson.scripts?.['check:gallery-followups']==='node scripts/check-gallery-followups.mjs','package.json must expose the Gallery followups contract');
expect(preflight.includes('npm run check:gallery-followups'),'preflight must run the Gallery followups contract');
for(const page of activeVisitorPages){
  const html=read(page);
  const main=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]??'';
  expect(!/Victor(?:'s|’s)/.test(main),`${page} visitor-facing content must use first person instead of third-person possessive`);
}
expect(read('about.html').includes('title="Spotify playlist"'),'About playlist accessible title must avoid unnecessary possessive wording');
expect(read('salmagazine.html').includes("Read all nine issues produced across five years, then continue to the magazine's latest releases."),'Star & Lamp archive copy must avoid unnecessary possessive wording');

if(failures.length){console.error(`GALLERY FOLLOWUPS CONTRACT: FAIL (${failures.length})`);for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log('GALLERY FOLLOWUPS CONTRACT: PASS');
console.log('- 10-piece Daysigns square grid, bounded Ekos clarification, and intentional four-study Magi edit');
