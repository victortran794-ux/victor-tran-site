#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const expect=(v,m)=>{if(!v)failures.push(m)};
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const expected={
 'images/mendenhall/type-thumbnail.png':'8f7cdcaf8b5f8bce79e86708eb4d33519cf8692955b8c2fbf8ca1bd699db3bc6',
 'images/mendenhall/mendenhall-layout.png':'7fdbbf7e89adab301503b12c9a76e2829336306b8bf3099088989837185249f4',
 'images/mendenhall/mendenhall-sketches.png':'f813043a6565f6e8d26ed299428fdb8f2e5d07ccf45063997518f53f4a77433a',
 'images/mendenhall/tran-type-2.jpg':'fff00e6cbac1d579b6497ef6d9e54cb5ce897ecbceb63d0b4fa15f9006f8d794',
};
const encodedPixels={
 'images/mendenhall/type-thumbnail.png':'b036923641b29e919389cbb1c670eb82559880ecafd1c7e8b52e7c35f36b61ff',
 'images/mendenhall/mendenhall-sketches.png':'ab991940125ba596e056ab423dd6de2f78af986b65289cd12a33c663a117c40b',
 'images/mendenhall/tran-type-2.jpg':'15422c3881f594c508fb5c51e8e8319a42afd6fc35421427a175b247d62c41ff',
};
const pngIdatHash=(bytes)=>{let offset=8;const chunks=[];while(offset<bytes.length){const length=bytes.readUInt32BE(offset);const type=bytes.subarray(offset+4,offset+8).toString('ascii');if(type==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));offset+=12+length;}return crypto.createHash('sha256').update(Buffer.concat(chunks)).digest('hex');};
const jpegScanHash=(bytes)=>{const marker=bytes.lastIndexOf(Buffer.from([0xff,0xda]));return crypto.createHash('sha256').update(bytes.subarray(marker)).digest('hex');};
for(const [file,hash] of Object.entries(expected)){
 const full=path.join(root,file);expect(fs.existsSync(full),`${file}: missing`);if(fs.existsSync(full)){const bytes=fs.readFileSync(full);expect(crypto.createHash('sha256').update(bytes).digest('hex')===hash,`${file}: derivative hash drifted`);const latin=bytes.toString('latin1');expect(!/(?:xmpmeta|photoshop:|xmpMM:|DocumentAncestors|Exif\u0000\u0000|Photoshop 3\.0)/i.test(latin),`${file}: embedded Adobe/EXIF metadata remains`);if(encodedPixels[file]){const actual=file.endsWith('.png')?pngIdatHash(bytes):jpegScanHash(bytes);expect(actual===encodedPixels[file],`${file}: encoded pixels were recompressed or changed`);}}
}
const generator=read('scripts/build-visual-archives-integration.py');
expect(generator.includes('id="mendenhall-type"'),'generator: bounded Mendenhall section missing');
expect(generator.includes('from the heart of the frozen glacier'),'generator: poster phrase/subtlety missing');
expect(generator.includes('data-mendenhall-view="poster"'),'generator: poster view missing');
expect(generator.includes('data-mendenhall-view="alphabet"'),'generator: alphabet view missing');
expect(generator.includes('data-mendenhall-view="specimen"'),'generator: specimen view missing');
expect(generator.includes('data-mendenhall-view="studies"'),'generator: studies view missing');
expect(generator.includes('Type-design exploration by Victor Tran'),'generator: authorship framing missing');
expect(generator.includes('--mendenhall-label: #fff9ea'),'generator: contrast-safe label token missing');
expect(!/download font|commercially released|Forest Service|official partnership/i.test(generator),'generator: unsupported release or affiliation claim');
const page=read('graphicgallery.html');
expect(page.includes('id="mendenhall-type"'),'page: Mendenhall section missing');
expect(page.includes('js/graphicgallery.js'),'page: scoped letterform controller missing');
expect(!page.includes('heart-frozen-void.html'),'page: must not link to a separate Frozen Void route');
expect(!fs.existsSync(path.join(root,'heart-frozen-void.html')),'standalone Frozen Void route must remain absent');
const jsPath=path.join(root,'js/graphicgallery.js');expect(fs.existsSync(jsPath),'js/graphicgallery.js missing');
if(fs.existsSync(jsPath)){const js=fs.readFileSync(jsPath,'utf8');expect(js.includes('[data-mendenhall-picker]'),'controller: picker binding missing');expect(js.includes('aria-pressed'),'controller: selected-state sync missing');}
const shell=read('data/site-shell.json');expect(!shell.includes('mendenhall')&&!shell.includes('heart-frozen'),'Mendenhall must remain out of global navigation');
if(failures.length){console.error(`MENDENHALL TYPOGRAPHY CONTRACT: FAIL\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MENDENHALL TYPOGRAPHY CONTRACT: PASS assets=4 views=4 route=embedded rights=self-authored');
