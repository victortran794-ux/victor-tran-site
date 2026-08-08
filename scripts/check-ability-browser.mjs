#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root=process.cwd();
const baseUrl=process.env.SITE_URL||'http://127.0.0.1:8765';
const evidenceDir=process.env.ABILITY_EVIDENCE_DIR||path.join(root,'.hermes','evidence','ability');
const chrome=[process.env.CHROME_BIN,'/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean).find(fs.existsSync);
if(!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ability-browser-'));
const portFile=path.join(profile,'DevToolsActivePort');
let port,chromeLog='',cdp;
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-allow-origins=*','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1440,1000','about:blank'],{stdio:['ignore','ignore','pipe']});
child.stderr.on('data',(chunk)=>{chromeLog+=chunk.toString()});
const delay=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const assert=(ok,message)=>{if(!ok) throw new Error(message)};
async function stopChild(process,timeout=2000){
  if(process.exitCode!==null)return;
  let resolveExit;
  const exited=new Promise((resolve)=>{resolveExit=resolve;process.once('exit',resolve)});
  if(process.exitCode!==null){process.off('exit',resolveExit);return}
  process.kill('SIGTERM');
  if(await Promise.race([exited.then(()=>true),delay(timeout).then(()=>false)]))return;
  if(process.exitCode===null)process.kill('SIGKILL');
  await Promise.race([exited,delay(1000)]);
}
async function json(url){const response=await fetch(url);if(!response.ok) throw new Error(`${response.status} ${url}`);return response.json()}
async function target(){let last;for(let attempt=0;attempt<80;attempt+=1){try{if(!port&&fs.existsSync(portFile)){const candidate=Number.parseInt(fs.readFileSync(portFile,'utf8').split(/\r?\n/,1)[0],10);if(candidate>0) port=candidate}if(!port) throw new Error('Chrome DevTools port is not ready');const page=(await json(`http://127.0.0.1:${port}/json/list`)).find((item)=>item.type==='page');if(page?.webSocketDebuggerUrl) return page}catch(error){last=error}if(child.exitCode!==null) throw new Error(`Chrome exited ${child.exitCode}: ${chromeLog}`);await delay(100)}throw last}
class Cdp{
  constructor(url){this.url=url;this.id=1;this.pending=new Map();this.waiters=new Map();this.errors=[]}
  async open(){this.socket=new WebSocket(this.url);this.socket.addEventListener('message',(event)=>{const message=JSON.parse(event.data);if(message.id){const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result);return}if(message.method==='Runtime.exceptionThrown'||(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error'))this.errors.push(message.params);const waiters=this.waiters.get(message.method)||[];this.waiters.delete(message.method);waiters.forEach((resolve)=>resolve(message.params))});await new Promise((resolve,reject)=>{let timer;const finish=(callback,value)=>{clearTimeout(timer);this.socket.removeEventListener('open',onOpen);this.socket.removeEventListener('error',onError);callback(value)};const onOpen=()=>finish(resolve);const onError=(event)=>finish(reject,new Error(`WebSocket open failed: ${event.message||'unknown error'}`));this.socket.addEventListener('open',onOpen,{once:true});this.socket.addEventListener('error',onError,{once:true});timer=setTimeout(()=>{try{this.socket.close()}catch{}finish(reject,new Error('WebSocket open timed out'))},10000)})}
  call(method,params={}){const id=this.id++;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))reject(new Error(`${method} timed out`))},15000)})}
  event(method){return new Promise((resolve,reject)=>{const waiters=this.waiters.get(method)||[];waiters.push(resolve);this.waiters.set(method,waiters);setTimeout(()=>reject(new Error(`${method} event timed out`)),15000)})}
  async evaluate(expression){const result=await this.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value}
  async navigate(url){const loaded=this.event('Page.loadEventFired');await this.call('Page.navigate',{url});await loaded;await delay(200)}
  async screenshot(name){const result=await this.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(evidenceDir,name),Buffer.from(result.data,'base64'))}
}
try{
  fs.mkdirSync(evidenceDir,{recursive:true});
  cdp=new Cdp((await target()).webSocketDebuggerUrl);await cdp.open();await cdp.call('Page.enable');await cdp.call('Runtime.enable');
  let states=0;
  for(const viewport of [{label:'390',width:390,height:844,mobile:true},{label:'768',width:768,height:1024,mobile:true},{label:'1440',width:1440,height:1000,mobile:false}]){
    await cdp.call('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.mobile});
    for(const theme of ['light','dark']){
      await cdp.navigate(`${baseUrl}/abilityexperience.html`);await cdp.evaluate(`localStorage.setItem('lens',${JSON.stringify(theme)})`);await cdp.navigate(`${baseUrl}/abilityexperience.html`);
      const state=await cdp.evaluate(`(async()=>{const images=[...document.querySelectorAll('main#main-content img')];images.forEach((image)=>image.loading='eager');await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));const nodes=[...document.querySelectorAll('.ability-diagram-node')];const rects=nodes.map((node)=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}});return {viewport:[innerWidth,innerHeight],theme:document.documentElement.dataset.theme,stored:localStorage.getItem('lens'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,images:images.length,failed:images.filter((image)=>!image.complete||!image.naturalWidth).map((image)=>image.getAttribute('src')),labels:nodes.map((node)=>node.querySelector('strong')?.textContent.trim()),rects,aria:document.querySelector('.ability-diagram-path')?.getAttribute('aria-label'),lastColor:getComputedStyle(nodes.at(-1),'::before').backgroundColor,shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav'))}})()`);
      assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height,`viewport drift ${state.viewport}`);assert(state.stored===theme&&(theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light'),`theme failed ${viewport.label} ${theme}`);assert(state.overflow===0,`overflow ${viewport.label} ${theme}`);assert(state.images===9&&!state.failed.length,`media failed ${JSON.stringify(state)}`);assert(JSON.stringify(state.labels)===JSON.stringify(['Mark','Iconography','Illustration','Application']),`sequence failed ${JSON.stringify(state.labels)}`);assert(state.aria==='Identity mark connects to iconography, illustration, and applied identity across cycling kits and event pieces',`aria failed ${state.aria}`);assert(state.lastColor===(theme==='dark'?'rgb(240, 106, 181)':'rgb(234, 59, 153)'),`application node color failed ${viewport.label} ${theme}: ${state.lastColor}`);assert(state.shell,`shared shell failed`);
      if(viewport.width>700) assert(state.rects.every((rect)=>Math.abs(rect.y-state.rects[0].y)<2)&&state.rects.every((rect,index)=>index===0||rect.x>state.rects[index-1].x),`desktop diagram geometry failed ${JSON.stringify(state.rects)}`);else assert(state.rects.every((rect)=>Math.abs(rect.x-state.rects[0].x)<2)&&state.rects.every((rect,index)=>index===0||rect.y>state.rects[index-1].y),`mobile diagram geometry failed ${JSON.stringify(state.rects)}`);
      if((viewport.width===390&&theme==='light')||(viewport.width===1440&&theme==='dark')){await cdp.evaluate(`document.querySelector('.ability-diagram').scrollIntoView({block:'center',behavior:'instant'})`);await delay(700);await cdp.screenshot(`ability-${viewport.label}-${theme}-diagram.png`)}states+=1;
    }
  }
  assert(!cdp.errors.length,`browser errors ${JSON.stringify(cdp.errors)}`);console.log(`ABILITY BROWSER CONTRACT: PASS states=${states} images=9 sequence=4 overflow=0`);
}finally{try{cdp?.socket?.close()}catch{}await stopChild(child);try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
