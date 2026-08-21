#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome/Chromium not found in a standard location; set CHROME_BIN');

const outputDir = path.join(root, 'images', 'pikapp-case-study');
const markUrl = pathToFileURL(path.join(outputDir, 'app-star-shield.svg')).href;
const patternUrl = pathToFileURL(path.join(outputDir, 'pattern-dark-blue-display.svg')).href;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pikapp-remaster-'));

const common = `
  *{box-sizing:border-box}
  html,body{width:390px;height:844px;margin:0;overflow:hidden;background:#0077a8}
  body{font-family:Arial,Helvetica,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
  .screen{position:relative;width:390px;height:844px;overflow:hidden;background:#0077a8}
  .pattern{background-color:#0077a8;background-image:linear-gradient(rgba(0,119,168,.28),rgba(0,119,168,.28)),url('${patternUrl}');background-position:center;background-size:430px auto}
  .status{position:absolute;z-index:10;top:0;left:0;right:0;height:44px;padding:15px 20px 0;display:flex;align-items:flex-start;justify-content:space-between;font-size:14px;font-weight:750;letter-spacing:.01em}
  .status-icons{display:flex;align-items:center;gap:7px}.signal{display:flex;align-items:flex-end;gap:2px;height:12px}.signal i{display:block;width:3px;border-radius:2px;background:#fff}.signal i:nth-child(1){height:6px}.signal i:nth-child(2){height:9px}.signal i:nth-child(3){height:12px}.wifi{width:9px;height:9px;border:2px solid #fff;border-top-color:transparent;border-left-color:transparent;transform:rotate(45deg);border-radius:1px}.battery{position:relative;width:20px;height:9px;border:1.8px solid #fff;border-radius:3px}.battery:after{content:'';position:absolute;right:-4px;top:2px;width:2px;height:4px;border-radius:0 2px 2px 0;background:#fff}.battery:before{content:'';position:absolute;inset:1.5px 3px 1.5px 1.5px;border-radius:1px;background:#fff}
  .mark{display:block;object-fit:contain}.eyebrow{margin:0;font-size:11px;font-weight:800;line-height:1.2;letter-spacing:.1em;text-transform:uppercase}.muted{color:rgba(255,255,255,.72)}
  .info{display:grid;place-items:center;width:25px;height:25px;border:2px solid currentColor;border-radius:50%;font-size:14px;font-weight:800}
  .progress-track{height:16px;padding:3px;border:2px solid rgba(255,255,255,.92);border-radius:999px;background:#fff}.progress-track i{display:block;width:50%;height:100%;border-radius:999px 0 0 999px;background:#8fd4e8}.progress-track b{position:absolute;display:block}
  button{font:inherit}
`;

const login = {
  file: 'remaster-login.png',
  css: `
    .login{padding:44px 28px 28px;display:flex;flex-direction:column}
    .login-brand{margin-top:106px;text-align:center}.login-brand .mark{width:88px;height:88px;margin:0 auto 20px}.login-brand h1{margin:0;font-size:29px;font-weight:800;line-height:1;letter-spacing:.12em}.login-brand p{margin:9px 0 0;font-size:12px;font-weight:650;letter-spacing:.01em}
    .login-form{display:grid;gap:18px;margin-top:54px}.field{display:grid;gap:8px}.field label{font-size:13px;font-weight:750;letter-spacing:.01em}.field span{display:block;height:56px;border-radius:18px;background:#f7f7f4;box-shadow:0 1px 0 rgba(0,47,79,.18)}
    .login-action{height:56px;margin-top:2px;border:0;border-radius:999px;background:#ffb71b;color:#082f4f;font-size:16px;font-weight:800;letter-spacing:.01em}.login-links{display:flex;justify-content:space-between;margin-top:10px}.login-links span{font-size:13px;font-weight:700;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px}
  `,
  body: `<main class="screen pattern login"><div class="status"><strong>9:41</strong><div class="status-icons"><span class="signal"><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></div></div><section class="login-brand"><img class="mark" src="${markUrl}" alt=""><h1>PI KAPPA PHI</h1><p>Exceptional leaders. Uncommon opportunities.</p></section><section class="login-form"><div class="field"><label>Username</label><span></span></div><div class="field"><label>Password</label><span></span></div><button class="login-action">Log in</button><div class="login-links"><span>Forgot password?</span><span>Create an account</span></div></section></main>`,
};

const dashboard = {
  file: 'remaster-dashboard.png',
  css: `
    .dashboard{background:#f5f6f4;color:#082f4f}.dash-hero{height:403px;padding:52px 20px 26px;color:#fff;text-align:center}.dash-hero>.mark{width:58px;height:58px;margin:0 auto 10px}.dash-hero h1{margin:0;font-size:31px;font-weight:800;line-height:1;letter-spacing:-.035em}.dash-hero>p{margin:8px 0 0;font-size:13px;color:#fff}
    .dash-hero .status{color:#fff}.summary{margin-top:20px;padding:20px;border-radius:24px;background:#063f67;color:#fff;text-align:left;box-shadow:0 12px 30px rgba(0,47,79,.18)}.summary-top{display:flex;align-items:center;justify-content:space-between}.summary-top strong{font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.summary .progress-track{position:relative;margin-top:16px}.summary-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;text-align:center}.summary-stats small,.summary-stats strong{display:block}.summary-stats small{font-size:10px;color:#b9d7e4}.summary-stats strong{margin-top:4px;font-size:14px}.summary button{display:block;min-width:150px;height:46px;margin:18px auto 0;border:0;border-radius:999px;background:#ffb71b;color:#082f4f;font-size:13px;font-weight:800;letter-spacing:.02em}
    .bulletin{position:absolute;left:0;right:0;top:396px;bottom:72px;padding:25px 20px 18px;border-radius:28px 28px 0 0;background:#f5f6f4;text-align:left}.bulletin h2{margin:0 0 17px;font-size:27px;font-weight:800;line-height:1;letter-spacing:-.035em}.bulletin-list{display:grid;gap:11px}.bulletin article{padding:15px 16px;border:1px solid #dbe2e5;border-radius:16px;background:#fff}.bulletin article div{display:flex;align-items:center;justify-content:space-between;gap:12px}.bulletin h3{margin:0;font-size:15px;line-height:1.15}.bulletin small{font-size:10px;font-weight:750;color:#0077a8}.bulletin p{margin:7px 0 0;font-size:12px;line-height:1.38;color:#35617a}
    .bottom-nav{position:absolute;left:0;right:0;bottom:0;height:72px;display:grid;grid-template-columns:repeat(4,1fr);background:#063f67;color:#d5e7ef}.bottom-nav span{position:relative;display:grid;place-items:center;padding-top:17px;font-size:10px;font-weight:700}.bottom-nav span:before{content:'';position:absolute;top:11px;width:6px;height:6px;border:2px solid currentColor;border-radius:50%}.bottom-nav .active{color:#ffbe25}.bottom-nav .active:after{content:'';position:absolute;top:0;width:34px;height:4px;border-radius:0 0 4px 4px;background:#ffbe25}
  `,
  body: `<main class="screen dashboard"><div class="dash-hero pattern"><div class="status"><strong>9:41</strong><div class="status-icons"><span class="signal"><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></div></div><img class="mark" src="${markUrl}" alt=""><h1>Your progress</h1><p>Member view</p><section class="summary"><div class="summary-top"><strong>Sample term</strong><span class="info">i</span></div><div class="progress-track"><i></i></div><div class="summary-stats"><div><small>Due</small><strong>Sample</strong></div><div><small>Complete</small><strong>50%</strong></div><div><small>Milestones</small><strong>3 of 6</strong></div></div><button>See milestones</button></section></div><section class="bulletin"><h2>Chapter bulletin</h2><div class="bulletin-list"><article><div><h3>Chapter update</h3><small>Illustrative</small></div><p>Chapter information with a clear source and next step.</p></article><article><div><h3>Upcoming milestone</h3><small>Illustrative</small></div><p>The next action stays visible without competing with progress.</p></article><article><div><h3>National update</h3><small>Illustrative</small></div><p>Supporting information sits below what needs attention.</p></article></div></section><nav class="bottom-nav"><span class="active">Member</span><span>Chapter</span><span>National HQ</span><span>Settings</span></nav></main>`,
};

const milestones = {
  file: 'remaster-milestones.png',
  css: `
    .milestones{background:#eef3f4;color:#082f4f}.milestones .status{color:#fff}.milestone-head{height:286px;padding:51px 20px 22px;background:#063f67;color:#fff}.milestone-head .head-row{display:flex;align-items:center;justify-content:space-between}.milestone-head .mark{width:58px;height:58px}.close-x{position:relative;width:34px;height:34px}.close-x:before,.close-x:after{content:'';position:absolute;left:16px;top:5px;width:2px;height:24px;background:#fff}.close-x:before{transform:rotate(45deg)}.close-x:after{transform:rotate(-45deg)}.milestone-head h1{margin:15px 0 0;font-size:31px;font-weight:800;line-height:1;letter-spacing:-.035em}.milestone-head .term{display:flex;align-items:center;justify-content:space-between;margin-top:15px}.milestone-head .term strong{font-size:12px;letter-spacing:.08em;text-transform:uppercase}.milestone-head .progress-track{position:relative;margin-top:13px}.milestone-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:11px;text-align:center}.milestone-stats small,.milestone-stats strong{display:block}.milestone-stats small{font-size:10px;color:#bad4df}.milestone-stats strong{margin-top:3px;font-size:14px}
    .tasks{position:absolute;top:286px;left:0;right:0;bottom:68px;padding:24px 20px;background:#eef3f4;border-radius:26px 26px 0 0}.tasks h2{margin:0 0 16px;font-size:27px;font-weight:800;line-height:1;letter-spacing:-.035em}.task-list{display:grid;gap:12px}.task{padding:17px;border:1px solid #d6e0e3;border-radius:18px;background:#fff}.task-top{display:grid;grid-template-columns:30px 1fr auto;gap:12px;align-items:center}.state{width:28px;height:28px;border:2px solid #ffb71b;border-radius:50%}.task h3{margin:0;font-size:15px;line-height:1.2}.task small{font-size:10px;font-weight:750;color:#315a70}.task p{margin:14px 0 0;padding:13px 0 0;border-top:1px solid #bfcdd2;font-size:12px;line-height:1.45;color:#315a70}.task.done{background:#0077a8;color:#fff;border-color:#0077a8}.task.done .state{position:relative;border-color:#fff}.task.done .state:after{content:'';position:absolute;left:7px;top:3px;width:8px;height:14px;border-right:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(45deg)}.task.done small{color:#fff}.task.done p{color:#fff;border-color:rgba(255,255,255,.45)}
    .pull{position:absolute;left:0;right:0;bottom:0;height:68px;display:grid;place-items:center;background:#063f67}.pull:before{content:'';width:22px;height:22px;border-right:3px solid #fff;border-bottom:3px solid #fff;transform:rotate(45deg) translate(-4px,-4px)}
  `,
  body: `<main class="screen milestones"><div class="status"><strong>9:41</strong><div class="status-icons"><span class="signal"><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></div></div><header class="milestone-head"><div class="head-row"><img class="mark" src="${markUrl}" alt=""><span class="close-x"></span></div><h1>Your milestones</h1><div class="term"><strong>Sample term</strong><span class="info">i</span></div><div class="progress-track"><i></i></div><div class="milestone-stats"><div><small>Due</small><strong>Sample</strong></div><div><small>Complete</small><strong>50%</strong></div><div><small>Milestones</small><strong>3 of 6</strong></div></div></header><section class="tasks"><h2>Current term</h2><div class="task-list"><article class="task"><div class="task-top"><span class="state"></span><h3>Complete member education</h3><small>Sample due</small></div><p>Review the assigned module, complete the required activity, and submit it for chapter review. This text is illustrative.</p></article><article class="task done"><div class="task-top"><span class="state"></span><h3>Chapter service reflection</h3><small>Complete</small></div><p>Submitted for review</p></article><article class="task done"><div class="task-top"><span class="state"></span><h3>Member information</h3><small>Complete</small></div><p>Profile details confirmed</p></article></div></section><div class="pull"></div></main>`,
};

for (const screen of [login, dashboard, milestones]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${common}${screen.css}</style></head><body>${screen.body}</body></html>`;
  const source = path.join(tempDir, `${screen.file}.html`);
  const output = path.join(outputDir, screen.file);
  fs.writeFileSync(source, html);
  const result = spawnSync(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=390,844',
    '--run-all-compositor-stages-before-draw', `--screenshot=${output}`, pathToFileURL(source).href,
  ], { encoding: 'utf8', timeout: 30000 });
  if (result.status !== 0) throw new Error(`Chrome failed for ${screen.file}: ${result.stderr || result.stdout}`);
  const png = fs.readFileSync(output);
  if (png.length < 1000 || png.subarray(1, 4).toString() !== 'PNG') throw new Error(`Invalid PNG output: ${screen.file}`);
  console.log(`Rendered ${screen.file} (${png.length} bytes)`);
}

fs.rmSync(tempDir, { recursive: true, force: true });
