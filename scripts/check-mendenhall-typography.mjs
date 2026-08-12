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

};
const encodedPixels={
 'images/mendenhall/type-thumbnail.png':'b036923641b29e919389cbb1c670eb82559880ecafd1c7e8b52e7c35f36b61ff',
 'images/mendenhall/mendenhall-sketches.png':'ab991940125ba596e056ab423dd6de2f78af986b65289cd12a33c663a117c40b',

};
const pngIdatHash=(bytes)=>{let offset=8;const chunks=[];while(offset<bytes.length){const length=bytes.readUInt32BE(offset);const type=bytes.subarray(offset+4,offset+8).toString('ascii');if(type==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));offset+=12+length;}return crypto.createHash('sha256').update(Buffer.concat(chunks)).digest('hex');};
const jpegScanHash=(bytes)=>{const marker=bytes.lastIndexOf(Buffer.from([0xff,0xda]));return crypto.createHash('sha256').update(bytes.subarray(marker)).digest('hex');};
for(const [file,hash] of Object.entries(expected)){
 const full=path.join(root,file);expect(fs.existsSync(full),`${file}: missing`);if(fs.existsSync(full)){const bytes=fs.readFileSync(full);expect(crypto.createHash('sha256').update(bytes).digest('hex')===hash,`${file}: derivative hash drifted`);const latin=bytes.toString('latin1');expect(!/(?:xmpmeta|photoshop:|xmpMM:|DocumentAncestors|Exif\u0000\u0000|Photoshop 3\.0)/i.test(latin),`${file}: embedded Adobe/EXIF metadata remains`);if(encodedPixels[file]){const actual=file.endsWith('.png')?pngIdatHash(bytes):jpegScanHash(bytes);expect(actual===encodedPixels[file],`${file}: encoded pixels were recompressed or changed`);}}
}
const generator=read('scripts/build-visual-archives-integration.py');
expect(generator.includes('class="mendenhall-archive-trigger"'),'generator: gallery poster archive trigger missing');
expect(generator.includes('id="mendenhall-archive-dialog"'),'generator: expanded Mendenhall archive dialog missing');
expect(generator.includes('data-mendenhall-master="poster"'),'generator: complete main poster view missing');
expect(generator.includes('data-mendenhall-master="sentence"'),'generator: sentence specimen view missing');
expect(generator.includes('data-mendenhall-master="alphabet"'),'generator: alphabet specimen view missing');
expect(generator.includes('data-mendenhall-master="sketches"'),'generator: sketches view missing');
expect(generator.includes('images/mendenhall/type-thumbnail.png'),'generator: poster-phrase pick missing');
expect(generator.includes('images/mendenhall/mendenhall-layout.png'),'generator: alphabet pick missing');
expect(generator.includes('images/mendenhall/mendenhall-sketches.png'),'generator: studies pick missing');
expect(!generator.includes('data-mendenhall-picker'),'generator: page-level Mendenhall buttons must be removed');
expect(!generator.includes('mendenhall-feature'),'generator: standalone Mendenhall feature section must be removed');
expect(!generator.includes('data-viewer-picks'),'generator: generic lightbox picks must be removed');
expect(!/download font|commercially released|Forest Service|official partnership/i.test(generator),'generator: unsupported release or affiliation claim');
const page=read('graphicgallery.html');
expect(page.includes('src="images/gg-illus-4.jpg"'),'page: existing Mendenhall poster must remain in gallery');
expect((page.match(/data-mendenhall-view=/g)||[]).length===4,'page: expanded archive must expose exactly four topic views');
expect(page.includes('aria-controls="mendenhall-archive-dialog"'),'page: poster must control expanded archive dialog');
expect(!page.includes('data-mendenhall-picker'),'page: visible Mendenhall buttons must be absent');
expect(!page.includes('id="mendenhall-type"'),'page: standalone Mendenhall feature section must be absent');
expect(page.includes('js/graphicgallery.js'),'page: expanded archive controller must be requested');
expect(!page.includes('heart-frozen-void.html'),'page: must not link to a separate Frozen Void route');
expect(!fs.existsSync(path.join(root,'heart-frozen-void.html')),'standalone Frozen Void route must remain absent');
expect(!fs.existsSync(path.join(root,'images/mendenhall/tran-type-2.jpg')),'redundant second specimen must not be published');
const js=read('js/graphicgallery.js');expect(js.includes('showModal'),'archive controller: native dialog open missing');expect(js.includes('data-mendenhall-view'),'archive controller: view switching missing');expect(js.includes('returnFocus'),'archive controller: focus restoration missing');
const shell=read('data/site-shell.json');expect(!shell.includes('mendenhall')&&!shell.includes('heart-frozen'),'Mendenhall must remain out of global navigation');
if(failures.length){console.error(`MENDENHALL TYPOGRAPHY CONTRACT: FAIL\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MENDENHALL TYPOGRAPHY CONTRACT: PASS new_assets=3 gallery_poster=1 archive_views=4 rights=self-authored');
