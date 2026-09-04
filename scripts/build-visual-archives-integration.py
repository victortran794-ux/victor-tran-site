from pathlib import Path
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]

ART_ASSETS = {
    'old-one.webp': 'old-one.webp',
    'coffee.webp': 'coffee.webp',
}
GRAPHIC_ASSETS = {name: name for name in (
    'chantico.webp', 'dog.webp', 'abex.webp',
    'sc56-instagram-panel-series.webp', 'ibm-paltron-illustration-system.webp', 'wxo-illustration-system.webp',
    'sgla-2024-identity-development.webp',
    'sgla-2023-brand-guidelines.webp',
    'sgla-2024-signage-system.webp',
    'sgla-2024-ballroom-system.webp',
)}

SHARED_CSS = r'''
  <style id="visual-archive-v2-styles">
    .visual-archive-page .archive-primary { overflow: clip; }
    .visual-archive-page .archive-primary img,
    .visual-archive-page .archive-extended img { display: block; max-width: 100%; height: auto; }
    .visual-archive-page .archive-kicker {
      margin: 0 0 1rem; font: 600 .74rem/1.2 'Source Code Pro', monospace;
      letter-spacing: .14em; text-transform: uppercase;
    }
    .visual-archive-page .archive-title { margin: 0; font-family: 'DM Serif Display', serif; line-height: .92; }
    .visual-archive-page .archive-lede { max-width: 34rem; margin: 1.4rem 0 0; font-size: clamp(1rem, 1.6vw, 1.3rem); line-height: 1.55; }
    .visual-archive-page .archive-chapter { margin-top: clamp(5rem, 11vw, 10rem); scroll-margin-top: calc(var(--nav-h) + 1rem); }
    .visual-archive-page .archive-chapter-head { display: flex; align-items: baseline; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; }
    .visual-archive-page .archive-chapter h2 { margin: 0; font-family: 'DM Serif Display', serif; font-size: clamp(2.25rem, 5vw, 5.75rem); line-height: .96; scroll-margin-top: calc(var(--nav-h) + 1rem); }
    .visual-archive-page .archive-note { max-width: 27rem; margin: 0; line-height: 1.55; }
    .visual-archive-page .archive-frame { margin: 0; }
    .visual-archive-page .archive-frame figcaption { margin-top: .65rem; font: 500 .73rem/1.45 'Source Code Pro', monospace; letter-spacing: .04em; }
    .visual-archive-page .archive-extended { background: var(--bg); color: var(--text); border-top: 1px solid var(--border); scroll-margin-top: var(--nav-h); }
    .visual-archive-page .archive-extended > summary {
      min-height: 64px; padding: 1.25rem var(--page-x); cursor: pointer; display: flex; align-items: center;
      justify-content: space-between; gap: 1rem; font: 600 .8rem/1.2 'Source Code Pro', monospace;
      letter-spacing: .1em; text-transform: uppercase; list-style: none;
    }
    .visual-archive-page .archive-extended > summary::-webkit-details-marker { display: none; }
    .visual-archive-page .archive-extended > summary::after { content: '+'; font-size: 1.2rem; }
    .visual-archive-page .archive-extended[open] > summary::after { content: '−'; }
    .visual-archive-page .archive-extended-intro { max-width: 46rem; margin: 0; padding: 2rem var(--page-x) 0; color: var(--text-2); line-height: 1.6; }
    .visual-archive-page .archive-extended-content { padding-bottom: var(--section-y); }
    .visual-archive-page .archive-extended-content > .gallery-pair,
    .visual-archive-page .archive-extended-content > .gallery-grid,
    .visual-archive-page .archive-extended-content > .gallery-section,
    .visual-archive-page .archive-extended-content > .gallery-feature { content-visibility: auto; contain-intrinsic-size: 900px; }
    @media (prefers-reduced-motion: no-preference) {
      .visual-archive-page .archive-primary img { transition: transform 320ms ease; }
      .visual-archive-page .archive-primary figure:hover img { transform: scale(1.012); }
    }
    @media (max-width: 720px) {
      .visual-archive-page .archive-chapter-head { display: block; }
      .visual-archive-page .archive-note { margin-top: .8rem; }
      .visual-archive-page .archive-frame figcaption { font-size: .68rem; }
    }
  </style>
'''

ART_CSS = r'''
  <style id="art-archive-v2-skin">
    .art-archive-v2 .archive-primary { --paper: #f0e0c7; --ink: #2c241d; --orange: #b03a17; background: var(--paper); color: var(--ink); }
    [data-theme="dark"] .art-archive-v2 .archive-primary { --paper: #211b17; --ink: #f1e2cd; --orange: #ff7447; }
    .art-archive-v2 .art-shell { width: min(100%, 1480px); margin: 0 auto; padding: clamp(4.5rem, 9vw, 9rem) var(--page-x) clamp(7rem, 12vw, 12rem); }
    .art-archive-v2 .archive-kicker, .art-archive-v2 .archive-frame figcaption { color: var(--orange); }
    .art-archive-v2 .art-opening { min-height: min(72vh, 52rem); display: flex; align-items: flex-end; padding-bottom: clamp(3rem, 7vw, 7rem); }
    .art-archive-v2 .archive-title { font-size: clamp(4rem, 10vw, 9.5rem); max-width: 8ch; }
    .art-archive-v2 .art-opening-stack,
    .art-archive-v2 .art-live-wall { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(.8rem, 2vw, 1.75rem); align-items: start; }
    .art-archive-v2 .art-opening-stack .is-large { grid-column: span 6; }
    .art-archive-v2 .art-opening-stack .is-medium { grid-column: span 4; }
    .art-archive-v2 .art-opening-stack .is-small { grid-column: span 2; }
    .art-archive-v2 .art-opening-stack .series-slideshow { max-width: none; margin: 0; padding: 0; display: block; }
    .art-archive-v2 .art-opening-stack .series-slideshow-stage { width: 100%; height: auto; aspect-ratio: 1 / 2; }
    .art-archive-v2 .art-opening-stack img,
    .art-archive-v2 .art-live-wall img { width: 100%; }
    .art-archive-v2 .art-live-wall .is-wide { grid-column: 1 / -1; }
    .art-archive-v2 .art-live-wall .is-third { grid-column: span 4; }
    .art-archive-v2 .art-daysigns-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0;
      width: min(calc(100% - clamp(4rem, 10vw, 12rem)), 1500px);
      margin: 0 auto;
    }
    .art-archive-v2 .art-daysigns-grid figure { margin: 0; padding: 0; min-width: 0; }
    .art-archive-v2 .art-daysigns-grid img { width: 100%; height: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
    .art-archive-v2 .art-sc56,
    .art-archive-v2 .art-restored-wall { align-items: start; gap: clamp(.8rem, 2vw, 1.5rem); }
    .art-archive-v2 .art-sc56 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .art-archive-v2 .art-restored-wall { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .art-archive-v2 .art-restored-wall figure { margin: 0; }
    .art-archive-v2 .art-restored-wall figure:first-child { grid-column: span 2; grid-row: span 2; }
    .art-archive-v2 .art-restored-wall img { width: 100%; height: auto; }
    .art-archive-v2 .art-sc56 img,
    .art-archive-v2 .art-restored-wall img { width: 100%; }
    .art-archive-v2 .art-diamonds { display: grid; grid-template-columns: repeat(20, minmax(0, 1fr)); align-items: start; gap: clamp(.65rem, 2vw, 1.5rem); }
    .art-archive-v2 .art-diamonds figure { min-width: 0; grid-column: span 5; }
    .art-archive-v2 .art-diamonds figure:nth-child(n+5):nth-child(-n+9) { grid-column: span 4; }

    .art-archive-v2 .archive-chapter-head { display: grid; grid-template-columns: 1fr; align-items: end; border-top: 2px solid var(--orange); gap: .65rem; padding-top: 1rem; }
    .art-archive-v2 .archive-chapter-head h2 { max-width: 18ch; font-size: clamp(2.35rem, 4.5vw, 4.75rem); line-height: .98; letter-spacing: -.025em; }
    .art-archive-v2 .art-section-kicker { margin: 0; color: var(--orange-strong); font: 700 .72rem/1.2 'Source Code Pro', monospace; letter-spacing: .12em; text-transform: uppercase; }
    @media (max-width: 720px) {
      .art-archive-v2 .art-shell { padding-top: 4rem; }
      .art-archive-v2 .art-opening { min-height: auto; padding-bottom: 3rem; }
      .art-archive-v2 .archive-title { font-size: clamp(3.8rem, 19vw, 6rem); }
      .art-archive-v2 .art-opening-stack { grid-template-columns: repeat(6, minmax(0, 1fr)); }
      .art-archive-v2 .art-opening-stack .is-large { grid-column: span 6; }
      .art-archive-v2 .art-opening-stack .is-medium { grid-column: span 4; }
      .art-archive-v2 .art-opening-stack .is-small { grid-column: span 2; }
      .art-archive-v2 .art-live-wall { grid-template-columns: 1fr; }
      .art-archive-v2 .art-live-wall .is-wide,
      .art-archive-v2 .art-live-wall .is-third { grid-column: 1; }
      .art-archive-v2 .art-daysigns-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); width: calc(100% - 2rem); }
      .art-archive-v2 .art-restored-wall { grid-template-columns: 1fr 1fr; }
      .art-archive-v2 .art-restored-wall figure:first-child { grid-column: span 2; grid-row: auto; }
      .art-archive-v2 .art-sc56 { grid-template-columns: 1fr; }
      .art-archive-v2 .art-diamonds { grid-template-columns: 1fr 1fr; }
      .art-archive-v2 .art-diamonds figure,
      .art-archive-v2 .art-diamonds figure:nth-child(n+5):nth-child(-n+9) { grid-column: auto; }
      .art-archive-v2 .art-diamonds figure:last-child { grid-column: 1 / -1; width: 50%; justify-self: center; }

      .art-archive-v2 .archive-chapter-head { gap: .55rem; }
      .art-archive-v2 .archive-chapter-head h2 { font-size: clamp(2.35rem, 10.5vw, 3.8rem); }
    }
  </style>
'''

GRAPHIC_CSS = r'''
  <style id="graphic-archive-v2-skin">
    .graphic-archive-v2 .archive-primary { --violet: #5b39d9; --acid: #e8ff4f; --pink: #ff6db4; --cream: #fff9ea; background: var(--violet); color: var(--cream); }
    [data-theme="dark"] .graphic-archive-v2 .archive-primary { --violet: #2e1d70; --acid: #ddfa48; --pink: #ff76bc; --cream: #fff9ea; }
    .graphic-archive-v2 .graphic-shell { width: min(100%, 1600px); margin: 0 auto; padding: clamp(4rem, 8vw, 8rem) var(--page-x) clamp(7rem, 11vw, 11rem); }
    .graphic-archive-v2 .archive-kicker { color: var(--acid); }
    .graphic-archive-v2 .archive-title { font-family: 'Barlow', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -.065em; font-size: clamp(4.4rem, 13vw, 13rem); max-width: 7ch; }
    .graphic-archive-v2 .archive-lede { color: var(--cream); }
    .graphic-archive-v2 .graphic-opening { position: relative; min-height: calc(100vh - var(--nav-h)); display: grid; grid-template-columns: .7fr 1.3fr; gap: clamp(2rem, 5vw, 6rem); align-items: center; }
    .graphic-archive-v2 .graphic-opening::after { content: 'FORM'; position: absolute; right: -4vw; bottom: -4rem; font: 700 clamp(7rem, 23vw, 24rem)/.7 'Barlow', sans-serif; letter-spacing: -.08em; color: color-mix(in srgb, var(--pink) 52%, transparent); pointer-events: none; }
    .graphic-archive-v2 .graphic-opening figure { position: relative; z-index: 1; border: 14px solid var(--acid); }
    .graphic-archive-v2 .graphic-opening figure img { width: 100%; }
    .graphic-archive-v2 .archive-chapter h2 { font-family: 'Barlow', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -.045em; }
    .graphic-archive-v2 .archive-chapter-head { display: grid; grid-template-columns: 1fr; align-items: end; border-top: 2px solid var(--pink); gap: .65rem; padding-top: 1rem; }
    .graphic-archive-v2 .archive-chapter-head h2 { max-width: 18ch; font-size: clamp(2.35rem, 4.5vw, 4.75rem); line-height: .92; letter-spacing: -.035em; }
    .graphic-archive-v2 .graphic-section-kicker { margin: 0; color: var(--acid); font: 700 .72rem/1.2 'Source Code Pro', monospace; letter-spacing: .12em; text-transform: uppercase; }
    .graphic-archive-v2 .graphic-edc,
    .graphic-archive-v2 .graphic-brand-grid,
    .graphic-archive-v2 .graphic-sgla,
    .graphic-archive-v2 .graphic-slides { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(.7rem, 2vw, 1.5rem); align-items: start; }
    .graphic-archive-v2 .graphic-edc .is-half { grid-column: span 6; }
    .graphic-archive-v2 .graphic-edc img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; object-position: center; }
    .graphic-archive-v2 .graphic-edc figure:first-child img { object-position: center 78%; }
    .graphic-archive-v2 .graphic-sgla .is-logo { grid-column: span 4; }
    .graphic-archive-v2 .graphic-sgla .is-feature { grid-column: span 8; }
    .graphic-archive-v2 .graphic-sgla .is-half { grid-column: span 6; }
    .graphic-archive-v2 .graphic-sgla .is-full { grid-column: 1 / -1; }
    .graphic-archive-v2 .graphic-brand-grid .is-full { grid-column: 1 / -1; }
    .graphic-archive-v2 .graphic-brand-grid .is-third { grid-column: span 4; aspect-ratio: 4 / 3; display: grid; place-items: center; background: color-mix(in srgb, var(--cream) 12%, transparent); }
    .graphic-archive-v2 .graphic-brand-grid .is-third img { width: 100%; height: 100%; object-fit: contain; }
    .graphic-archive-v2 .graphic-brand-grid .is-four { grid-column: span 4; }
    .graphic-archive-v2 .graphic-brand-grid .is-eight { grid-column: span 8; }
    .graphic-archive-v2 .graphic-events { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(1rem, 4vw, 4rem); align-items: start; }
    .graphic-archive-v2 .graphic-events .is-event-tall { grid-column: span 5; }
    .graphic-archive-v2 .graphic-events .is-event-wide { grid-column: span 7; }
    .graphic-archive-v2 .graphic-events img { width: 100%; height: auto; }
    .graphic-archive-v2 .graphic-illustrations { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(.7rem, 2vw, 1.5rem); align-items: start; }
    .graphic-archive-v2 .mendenhall-gallery-poster { background: color-mix(in srgb, var(--cream) 7%, transparent); }
    .graphic-archive-v2 .mendenhall-archive-trigger { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 933 / 1600; padding: clamp(.35rem, .7vw, .7rem); border: 0; background: transparent; color: inherit; cursor: zoom-in; overflow: hidden; }
    .graphic-archive-v2 .mendenhall-archive-trigger > img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .graphic-archive-v2 .mendenhall-archive-cue { position: absolute; right: .75rem; bottom: .75rem; display: inline-grid; place-items: center; width: 2.75rem; height: 2.75rem; border: 1px solid rgba(255,255,255,.76); border-radius: 50%; background: rgba(17,17,17,.86); color: #fff; opacity: 0; transition: opacity .2s ease; }
    .graphic-archive-v2 .mendenhall-archive-cue::before { content: "↗"; font-size: .9rem; }
    .graphic-archive-v2 .mendenhall-archive-trigger:hover .mendenhall-archive-cue,
    .graphic-archive-v2 .mendenhall-archive-trigger:focus-visible .mendenhall-archive-cue { opacity: 1; }
    body.mendenhall-archive-open { overflow: hidden; padding-right: var(--mendenhall-scrollbar, 0); }
    .graphic-archive-v2 .mendenhall-archive-dialog { width: min(1480px, calc(100vw - 42px)); height: min(900px, calc(100dvh - 42px)); max-width: none; max-height: none; margin: auto; padding: 0; border: 0; background: #fff9ea; color: #073f49; box-shadow: 0 30px 100px rgba(0,0,0,.52); overflow: hidden; }
    .graphic-archive-v2 .mendenhall-archive-dialog::backdrop { background: rgba(7,18,22,.8); backdrop-filter: blur(7px); }
    .graphic-archive-v2 .mendenhall-archive-topbar { height: 72px; padding: 0 22px 0 28px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(7,63,73,.24); background: #fff9ea; }
    .graphic-archive-v2 .mendenhall-archive-topbar p { margin: 0; font: 700 11px/1.2 'Source Code Pro', monospace; letter-spacing: .11em; text-transform: uppercase; }
    .graphic-archive-v2 .mendenhall-archive-close { width: 48px; height: 48px; border: 1px solid #073f49; border-radius: 50%; background: transparent; color: #073f49; font-size: 22px; cursor: pointer; }
    .graphic-archive-v2 .mendenhall-archive-close:hover { background: #073f49; color: #fff9ea; }
    .graphic-archive-v2 .mendenhall-archive-layout { height: calc(100% - 72px); display: grid; grid-template-columns: minmax(0,1fr) minmax(320px,390px); }
    .graphic-archive-v2 .mendenhall-archive-stage { position: relative; min-width: 0; min-height: 0; padding: 30px; background: #073f49; overflow: hidden; }
    .graphic-archive-v2 .mendenhall-archive-master { position: absolute; inset: 30px; display: block; width: calc(100% - 60px) !important; height: calc(100% - 60px) !important; max-width: none; max-height: none; object-fit: contain; border: 0; background: transparent; box-shadow: 0 22px 58px rgba(0,0,0,.35); }
    .graphic-archive-v2 .mendenhall-archive-master[hidden] { display: none; }
    .graphic-archive-v2 .mendenhall-archive-details { overflow: auto; padding: 42px 34px 36px; border-left: 1px solid rgba(7,63,73,.24); background: #fff9ea; }
    .graphic-archive-v2 .mendenhall-archive-kicker { margin: 0 0 12px; color: #a5232b; font: 700 10px/1.35 'Source Code Pro', monospace; letter-spacing: .1em; text-transform: uppercase; }
    .graphic-archive-v2 .mendenhall-archive-details h2 { margin: 0 0 14px; font: clamp(38px,3.2vw,52px)/1 'Playfair Display', Georgia, serif; letter-spacing: -.025em; }
    .graphic-archive-v2 .mendenhall-archive-lede { margin: 0 0 28px; color: #365d63; font: 16px/1.55 'Playfair Display', Georgia, serif; }
    .graphic-archive-v2 .mendenhall-archive-metadata { display: grid; gap: 12px; margin: 0 0 34px; padding: 20px 0; border-top: 1px solid rgba(7,63,73,.24); border-bottom: 1px solid rgba(7,63,73,.24); }
    .graphic-archive-v2 .mendenhall-archive-metadata div { display: grid; grid-template-columns: 82px 1fr; gap: 12px; }
    .graphic-archive-v2 .mendenhall-archive-metadata dt,
    .graphic-archive-v2 .mendenhall-archive-views-title { font: 700 10px/1.35 'Source Code Pro', monospace; letter-spacing: .08em; text-transform: uppercase; color: #365d63; }
    .graphic-archive-v2 .mendenhall-archive-metadata dd { margin: 0; font: 14px/1.4 Inter, sans-serif; }
    .graphic-archive-v2 .mendenhall-archive-views-title { margin: 0 0 12px; color: #073f49; }
    .graphic-archive-v2 .mendenhall-archive-views { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .graphic-archive-v2 .mendenhall-archive-view { min-height: 48px; padding: 0; border: 1px solid rgba(7,63,73,.28); background: #fff9ea; color: #073f49; cursor: pointer; }
    .graphic-archive-v2 .mendenhall-archive-view img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: #073f49; }
    .graphic-archive-v2 .mendenhall-archive-view[aria-pressed="true"] { border: 3px solid #d62d36; }
    @media (hover: none) { .graphic-archive-v2 .mendenhall-archive-cue { opacity: 1; } }
    @media (max-width: 800px) {
      .graphic-archive-v2 .mendenhall-archive-dialog { width: 100vw; height: 100dvh; margin: 0; }
      .graphic-archive-v2 .mendenhall-archive-topbar { height: 64px; padding-left: 18px; }
      .graphic-archive-v2 .mendenhall-archive-layout { height: calc(100% - 64px); display: block; overflow: auto; }
      .graphic-archive-v2 .mendenhall-archive-stage { height: 62dvh; padding: 18px; }
      .graphic-archive-v2 .mendenhall-archive-master { inset: 18px; width: calc(100% - 36px) !important; height: calc(100% - 36px) !important; box-shadow: none; }
      .graphic-archive-v2 .mendenhall-archive-details { overflow: visible; padding: 28px 20px 42px; border: 0; }
      .graphic-archive-v2 .mendenhall-archive-details h2 { font-size: 38px; }
    }
    .graphic-archive-v2 .graphic-slides.is-compact { display: block; columns: 4; column-gap: 8px; }
    .graphic-archive-v2 .graphic-slides.is-compact figure { break-inside: avoid; margin: 0 0 8px; }
    .graphic-archive-v2 .graphic-slides.is-compact img { width: 100%; }
    @media (min-width: 1200px) { .graphic-archive-v2 .graphic-slides.is-compact { columns: 5; } }
    .graphic-archive-v2 .archive-frame figcaption { color: var(--acid); }
    @media (max-width: 720px) {
      .graphic-archive-v2 .graphic-opening { min-height: auto; grid-template-columns: 1fr; }
      .graphic-archive-v2 .archive-title { font-size: clamp(4.3rem, 18vw, 7rem); }
      .graphic-archive-v2 .graphic-opening figure { margin-top: 2rem; border-width: 8px; }
      .graphic-archive-v2 .graphic-opening::after { font-size: 9rem; bottom: -2rem; }
      .graphic-archive-v2 .graphic-edc,
      .graphic-archive-v2 .graphic-brand-grid,
      .graphic-archive-v2 .graphic-sgla,
      .graphic-archive-v2 .graphic-slides { grid-template-columns: 1fr; }
      .graphic-archive-v2 .graphic-edc .is-half,
      .graphic-archive-v2 .graphic-brand-grid .is-full,
      .graphic-archive-v2 .graphic-brand-grid .is-third,
      .graphic-archive-v2 .graphic-brand-grid .is-four,
      .graphic-archive-v2 .graphic-brand-grid .is-eight,
      .graphic-archive-v2 .graphic-sgla .is-logo,
      .graphic-archive-v2 .graphic-sgla .is-feature,
      .graphic-archive-v2 .graphic-sgla .is-half,
      .graphic-archive-v2 .graphic-sgla .is-full,
      .graphic-archive-v2 .graphic-slides .is-full,
      .graphic-archive-v2 .graphic-slides .is-half,
      .graphic-archive-v2 .graphic-slides .is-third { grid-column: 1; }
      .graphic-archive-v2 .graphic-slides.is-compact { columns: 2; }
      .graphic-archive-v2 .graphic-illustrations { grid-template-columns: 1fr 1fr; }
      .graphic-archive-v2 .graphic-events { grid-template-columns: 1fr; }
      .graphic-archive-v2 .graphic-events .is-event-tall,
      .graphic-archive-v2 .graphic-events .is-event-wide { grid-column: 1; }
      .graphic-archive-v2 .archive-chapter-head { gap: .55rem; }
      .graphic-archive-v2 .archive-chapter-head h2 { font-size: clamp(2.35rem, 10.5vw, 3.8rem); }
    }
  </style>
'''

ART_PRIMARY = r'''
    <section class="archive-primary" aria-labelledby="art-archive-title">
      <div class="art-shell">
        <header class="art-opening">
          <div>
            <p class="section-label archive-kicker label-artwork">Art &amp; Illustration</p>
            <h1 class="archive-title" id="art-archive-title">An open studio wall.</h1>
            <p class="archive-lede">Digital and traditional work spanning character illustration, paintings, and personal series.</p>
          </div>
        </header>

        <div class="art-opening-stack" aria-label="Opening artwork stack">
          <figure class="archive-frame is-selectric is-large" data-live-primary><img loading="eager" fetchpriority="high" decoding="async" src="images/illus-ibm-selectric-web.jpg" width="1806" height="2396" alt="IBM Selectric 1961 blueprint illustration"><figcaption>IBM Selectric · 1961</figcaption></figure>
          <figure class="archive-frame is-horned is-medium series-slideshow" data-live-primary data-horned-slideshow aria-label="Horned Woman illustration series" aria-roledescription="slideshow">
            <div class="series-slideshow-stage" data-slideshow-interval="2000">
              <img class="series-slideshow-img is-active" loading="lazy" decoding="async" src="images/illus-untitled-5.jpg" width="800" height="1600" alt="Horned Woman pencil sketch">
              <img class="series-slideshow-img" loading="lazy" decoding="async" src="images/illus-untitled-6.jpg" width="800" height="1600" alt="Horned Woman painted study">
              <img class="series-slideshow-img" loading="lazy" decoding="async" src="images/illus-untitled-7.jpg" width="800" height="1600" alt="Horned Woman stylized black-and-white study">
              <img class="series-slideshow-img" loading="lazy" decoding="async" src="images/illus-untitled-8.jpg" width="800" height="1600" alt="Horned Woman glitch study">
              <img class="series-slideshow-img" loading="lazy" decoding="async" src="images/illus-untitled-9.jpg" width="800" height="1600" alt="Horned Woman pink overlay study">
              <img class="series-slideshow-img" loading="lazy" decoding="async" src="images/illus-untitled-10.jpg" width="800" height="1600" alt="Horned Woman watercolor study">
              <img class="series-slideshow-img" loading="lazy" decoding="async" src="images/illus-untitled-11.jpg" width="800" height="1600" alt="Horned Woman blue ink study">
              <button class="media-motion-toggle slideshow-pause-btn" type="button" aria-label="Pause slideshow" aria-pressed="false">Pause</button>
            </div>
          </figure>
          <figure class="archive-frame is-old-one is-small"><img loading="eager" fetchpriority="high" decoding="async" src="images/art-archive-v2/old-one.webp" width="1600" height="2071" alt="Black-and-white and turquoise character illustration"><figcaption>Old One</figcaption></figure>
        </div>

        <section class="archive-chapter" aria-labelledby="art-live-wall-title">
          <div class="archive-chapter-head">
            <p class="art-section-kicker">Selected illustrations</p>
            <h2 id="art-live-wall-title">Characters and worlds</h2>
          </div>
          <div class="art-live-wall">
            <figure class="archive-frame is-wide" data-live-primary><img loading="lazy" decoding="async" src="images/illus-lost.jpg" width="1600" height="669" alt="Lost"><figcaption>Lost</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-untitled-4.jpg" width="1117" height="1600" alt="Isometric architecture"><figcaption>Isometric architecture</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-untitled-2.jpg" width="1117" height="1600" alt="Golden mask"><figcaption>Golden mask</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-solar.jpg" width="1200" height="1600" alt="Solar"><figcaption>Solar</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-untitled-1.jpg" width="1117" height="1600" alt="Cosmic figure"><figcaption>Cosmic figure</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-1-9-24.jpg" width="1117" height="1600" alt="Digital painting"><figcaption>Digital painting</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-shelly.jpg" width="1117" height="1600" alt="Shelly"><figcaption>Shelly</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-glow.jpg" width="1117" height="1600" alt="Glow"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-forgive-me.jpg" width="1117" height="1600" alt="Forgive Me"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-1-14-24.jpg" width="1117" height="1600" alt="Green hooded figure"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-night-glow.jpg" width="1668" height="2388" alt="Night Glow"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-sharing.jpg" width="1668" height="2388" alt="Sharing"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-shatter.jpg" width="1117" height="1600" alt="Shatter"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-flesh-golem.jpg" width="1117" height="1600" alt="The Flesh Golem"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/illus-untitled-3.jpg" width="1668" height="2388" alt="Abstract figure"></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/art-archive-v2/coffee.webp" width="1400" height="1534" alt="Illustration of a moka pot and coffee cup"></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="art-daysigns-title">
          <div class="archive-chapter-head">
            <h2 id="art-daysigns-title">Daysigns</h2>
          </div>
          <div class="art-daysigns-grid" aria-label="Ten Daysigns illustrations">
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-03.webp" width="817" height="817" alt="Daysigns numbered illustration 3"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-04.webp" width="1109" height="1109" alt="Daysigns numbered illustration 4"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-05.webp" width="1109" height="1109" alt="Daysigns numbered illustration 5"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-06.webp" width="951" height="951" alt="Daysigns numbered illustration 6"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-07.webp" width="951" height="951" alt="Daysigns numbered illustration 7"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-08.webp" width="951" height="951" alt="Daysigns numbered illustration 8"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-10.webp" width="951" height="951" alt="Daysigns numbered illustration 10"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-11.webp" width="951" height="951" alt="Daysigns numbered illustration 11"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-12.webp" width="951" height="951" alt="Daysigns numbered illustration 12"></figure>
            <figure class="archive-frame" data-live-primary data-daysigns-item><img loading="lazy" decoding="async" src="images/daysigns/daysign-13.webp" width="1200" height="960" alt="Daysigns numbered illustration 13"></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="art-sc56-title">
          <div class="archive-chapter-head"><p class="art-section-kicker">Event illustration</p><h2 id="art-sc56-title">56th Supreme Chapter Chicago</h2></div>
          <div class="art-sc56">
            <figure class="archive-frame" data-live-primary data-sc56-primary><img loading="lazy" decoding="async" src="images/illus-sc-boat.jpg" width="1237" height="1600" alt="Supreme Chapter Chicago boat poster"></figure>
            <figure class="archive-frame" data-live-primary data-sc56-primary><img loading="lazy" decoding="async" src="images/illus-sc-park.jpg" width="1236" height="1600" alt="Supreme Chapter Chicago park map poster"></figure>
            <figure class="archive-frame" data-live-primary data-sc56-primary><img loading="lazy" decoding="async" src="images/illus-sc-tower.jpg" width="1237" height="1600" alt="Supreme Chapter Chicago tower poster"></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="art-diamond-title">
          <div class="archive-chapter-head">
            <p class="art-section-kicker">Card series</p>
            <h2 id="art-diamond-title">Suit of Diamonds</h2>
          </div>
          <div class="art-diamonds">
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-a.png" width="978" height="1400" alt="Suit of Diamonds: Ace"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-2.png" width="1668" height="2388" alt="Suit of Diamonds: Two"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-3.png" width="1668" height="2388" alt="Suit of Diamonds: Three"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-4.png" width="1668" height="2388" alt="Suit of Diamonds: Four"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-5.png" width="1668" height="2388" alt="Suit of Diamonds: Five"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-6.png" width="1668" height="2388" alt="Suit of Diamonds: Six"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-7.png" width="978" height="1400" alt="Suit of Diamonds: Seven"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-8.png" width="978" height="1400" alt="Suit of Diamonds: Eight"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-9.png" width="978" height="1400" alt="Suit of Diamonds: Nine"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-10.png" width="873" height="1250" alt="Suit of Diamonds: Ten"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-j.png" width="978" height="1400" alt="Suit of Diamonds: Jack"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-q.png" width="978" height="1400" alt="Suit of Diamonds: Queen"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/cards/diamond-k.png" width="978" height="1400" alt="Suit of Diamonds: King"></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="art-restored-wall-title">
          <div class="archive-chapter-head"><p class="art-section-kicker">Traditional media</p><h2 id="art-restored-wall-title">Traditional work</h2></div>
          <div class="art-restored-wall">
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/illus-large.jpg" width="835" height="1600" alt="Large ink and pen drawing"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/illus-img7358.jpg" width="794" height="1600" alt="Colorful creature painting"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/illus-img4537.jpg" width="1280" height="1600" alt="Detailed traditional ink face drawing"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/illus-img4496.jpg" width="1280" height="1600" alt="Biomechanical skull canvas painting"></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/illus-img4531.jpg" width="1280" height="1600" alt="Detailed traditional ink composition"></figure>
          </div>
        </section>
      </div>
    </section>
'''

# Artwork in the primary Art archive is meant to be viewed without repeated
# object labels; descriptive alt text remains on every image.
ART_PRIMARY = re.sub(r'<figcaption>[\s\S]*?</figcaption>', '', ART_PRIMARY)

# The Art responsive-media pilot is deliberately bounded to the opening trio.
# Full source paths remain available to the shared lightbox, while the page uses
# derivatives appropriate to the rendered slot.
RESPONSIVE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
IBM_SIZES = '(max-width: 720px) calc(100vw - 40px), calc(50vw - clamp(24px, 3.333vw, 48px) - clamp(0.4rem, 1vw, 0.875rem))'
OLD_ONE_SIZES = '(max-width: 720px) calc(33.333vw - 13.333px - clamp(0.533rem, 1.333vw, 1.167rem)), calc(16.667vw - clamp(8px, 1.111vw, 16px) - clamp(0.667rem, 1.667vw, 1.458rem))'
HORNED_SIZES = '(max-width: 720px) calc(66.667vw - 26.667px - clamp(0.267rem, 0.667vw, 0.583rem)), calc(33.333vw - clamp(16px, 2.222vw, 32px) - clamp(0.533rem, 1.333vw, 1.167rem))'


def responsive_art_image(full: str, src: str, srcset: str, sizes: str, width: int, height: int,
                         alt: str, thumb: str, *, eager: bool = False, deferred: bool = False) -> str:
    priority = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    if deferred:
        return (f'<img class="series-slideshow-img" {priority} decoding="async" src="{RESPONSIVE_PLACEHOLDER}" '
                f'data-deferred-src="{src}" data-deferred-srcset="{srcset}" data-deferred-sizes="{sizes}" '
                f'data-full-src="{full}" data-thumb-src="{thumb}" width="{width}" height="{height}" alt="{alt}">')
    return (f'<img {priority} decoding="async" src="{src}" srcset="{srcset}" sizes="{sizes}" '
            f'data-full-src="{full}" data-thumb-src="{thumb}" width="{width}" height="{height}" alt="{alt}">')


ART_PRIMARY = ART_PRIMARY.replace(
    '<img loading="eager" fetchpriority="high" decoding="async" src="images/illus-ibm-selectric-web.jpg" width="1806" height="2396" alt="IBM Selectric 1961 blueprint illustration">',
    responsive_art_image('images/illus-ibm-selectric-web.jpg', 'images/responsive/illus-ibm-selectric-web-960.webp',
                         'images/responsive/illus-ibm-selectric-web-480.webp 480w, images/responsive/illus-ibm-selectric-web-960.webp 960w, images/responsive/illus-ibm-selectric-web-1440.webp 1440w',
                         IBM_SIZES, 1806, 2396, 'IBM Selectric 1961 blueprint illustration',
                         'images/responsive/illus-ibm-selectric-web-480.webp', eager=True),
)
ART_PRIMARY = ART_PRIMARY.replace(
    '<img loading="eager" fetchpriority="high" decoding="async" src="images/art-archive-v2/old-one.webp" width="1600" height="2071" alt="Black-and-white and turquoise character illustration">',
    responsive_art_image('images/art-archive-v2/old-one.webp', 'images/responsive/old-one-240.webp',
                         'images/responsive/old-one-240.webp 240w, images/responsive/old-one-480.webp 480w',
                         OLD_ONE_SIZES, 1600, 2071, 'Black-and-white and turquoise character illustration',
                         'images/responsive/old-one-240.webp'),
)
for version, alt in [
    (5, 'Horned Woman pencil sketch'), (6, 'Horned Woman painted study'),
    (7, 'Horned Woman stylized black-and-white study'), (8, 'Horned Woman glitch study'),
    (9, 'Horned Woman pink overlay study'), (10, 'Horned Woman watercolor study'),
    (11, 'Horned Woman blue ink study'),
]:
    full = f'images/illus-untitled-{version}.jpg'
    src = f'images/responsive/illus-untitled-{version}-640.webp'
    srcset = f'images/responsive/illus-untitled-{version}-320.webp 320w, images/responsive/illus-untitled-{version}-640.webp 640w, images/responsive/illus-untitled-{version}-800.webp 800w'
    original = f'<img class="series-slideshow-img{" is-active" if version == 5 else ""}" loading="lazy" decoding="async" src="{full}" width="800" height="1600" alt="{alt}">'
    replacement = responsive_art_image(full, src, srcset, HORNED_SIZES, 800, 1600, alt,
                                       f'images/responsive/illus-untitled-{version}-320.webp', deferred=version != 5)
    if version == 5:
        replacement = replacement.replace('<img ', '<img class="series-slideshow-img is-active" ', 1)
    ART_PRIMARY = ART_PRIMARY.replace(original, replacement)

GRAPHIC_PRIMARY = r'''
    <section class="archive-primary" aria-labelledby="graphic-archive-title">
      <div class="graphic-shell">
        <header class="graphic-opening">
          <div>
            <p class="section-label archive-kicker label-design">Graphic Design</p>
            <h1 class="archive-title" id="graphic-archive-title">Graphics. Design. Print.</h1>
            <p class="archive-lede">Identity, print, presentation, illustration, and event work from side projects, explorations, and collaborations.</p>
          </div>
          <figure class="archive-frame">
            <img loading="eager" fetchpriority="high" decoding="async" src="images/logos-2.jpg" width="1600" height="960" alt="Chantico's Flame illustration">
            <figcaption>Applications · Chantico</figcaption>
          </figure>
        </header>

        <section class="archive-chapter" aria-labelledby="graphic-edc-title">
          <div class="archive-chapter-head"><p class="graphic-section-kicker">Project graphics</p><h2 id="graphic-edc-title">EDC / Boombox</h2></div>
          <div class="graphic-edc">
            <figure class="archive-frame is-half" data-live-primary><img loading="eager" fetchpriority="high" decoding="async" src="images/gg-edc-1.jpg" width="574" height="471" alt="EDC Boombox 3D"><figcaption>EDC Boombox · 3D</figcaption></figure>
            <figure class="archive-frame is-half" data-live-primary><img loading="lazy" decoding="async" src="images/gg-edc-0.jpg" width="1600" height="1279" alt="EDC Boombox illustration"><figcaption>EDC Boombox · illustration</figcaption></figure>
            <figure class="archive-frame is-half" data-live-primary><img loading="lazy" decoding="async" src="images/gg-edc-2.jpg" width="1600" height="1279" alt="EDC pink eye graphic"><figcaption>EDC · pink eye</figcaption></figure>
            <figure class="archive-frame is-half" data-live-primary><img loading="lazy" decoding="async" src="images/gg-edc-3.jpg" width="1600" height="1279" alt="EDC green eye graphic"><figcaption>EDC · green eye</figcaption></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="graphic-sgla-title">
          <div class="archive-chapter-head"><p class="graphic-section-kicker">Identity system</p><h2 id="graphic-sgla-title">Southeastern Greek Leadership Association</h2></div>
          <div class="graphic-sgla">
            <figure class="archive-frame is-logo" data-live-primary data-sgla-primary><img loading="lazy" decoding="async" src="images/thumb-sgla.webp" width="1081" height="1081" alt="SGLA identity mark over a warm multicolor grid"><figcaption>SGLA identity</figcaption></figure>
            <figure class="archive-frame is-feature" data-live-primary data-sgla-primary><img loading="lazy" decoding="async" src="images/graphic-archive-v2/sgla-2024-identity-development.webp" width="1225" height="792" alt="SGLA five-year anniversary identity explorations"><figcaption>Five-year identity explorations · 2024</figcaption></figure>
            <figure class="archive-frame is-half" data-live-primary data-sgla-primary><img loading="lazy" decoding="async" src="images/graphic-archive-v2/sgla-2023-brand-guidelines.webp" width="2400" height="1504" alt="SGLA brand guideline cover, logo, color, and typography spreads"><figcaption>Brand guidelines · 2023</figcaption></figure>
            <figure class="archive-frame is-half" data-live-primary data-sgla-primary><img loading="lazy" decoding="async" src="images/graphic-archive-v2/sgla-2024-ballroom-system.webp" width="2400" height="1350" alt="Blue, gold, and red SGLA five-year ballroom screen system"><figcaption>Ballroom screen system · 2024</figcaption></figure>
            <figure class="archive-frame is-full" data-live-primary data-sgla-primary><img loading="lazy" decoding="async" src="images/graphic-archive-v2/sgla-2024-signage-system.webp" width="2400" height="960" alt="Blue, gold, and red SGLA environmental banner system"><figcaption>Environmental banner system · 2024</figcaption></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="graphic-slides-title">
          <div class="archive-chapter-head"><p class="graphic-section-kicker">Presentation design</p><h2 id="graphic-slides-title">Selected slide work</h2></div>
          <div class="graphic-slides is-compact">
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-1.jpg" width="1600" height="900" alt="MTM Widescreen 21 presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-2.jpg" width="1600" height="900" alt="Bama 23 presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-3.jpg" width="2400" height="1350" alt="Better Fraternity presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-4.jpg" width="1600" height="900" alt="Drunk Feminist 18 presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-5.jpg" width="1600" height="900" alt="Drunk Feminist 44 presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-6.jpg" width="1600" height="900" alt="Hour Power Proof presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-7.jpg" width="3000" height="2250" alt="Leadership Out Loud presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-8.jpg" width="3000" height="2250" alt="Leadership Out Loud 19 presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-9.jpg" width="1600" height="1200" alt="Master Slide Revised presentation"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-10.jpg" width="1600" height="1200" alt="Master Slide 19 presentation"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-11.jpg" width="1600" height="1200" alt="Master Slide 29 presentation"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-12.jpg" width="1500" height="843" alt="Pillar presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-13.jpg" width="2133" height="1200" alt="Transitions presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-14.jpg" width="2133" height="1200" alt="Transitions 6 presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-15.jpg" width="1600" height="900" alt="MTM Widescreen presentation slide"></figure>
            <figure class="archive-frame" data-live-primary data-presentation-primary><img loading="lazy" decoding="async" src="images/gg-slides-16.jpg" width="4001" height="2251" alt="Presentation slide composition"></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="graphic-live-marks-title">
          <div class="archive-chapter-head"><p class="graphic-section-kicker">Brand applications</p><h2 id="graphic-live-marks-title">Marks and applications</h2></div>
          <div class="graphic-brand-grid">
            <figure class="archive-frame is-four" data-live-primary><img loading="lazy" decoding="async" src="images/gg-day-of-giving.png" width="1081" height="1080" alt="Pi Kappa Phi Day of Giving"><figcaption>Day of Giving</figcaption></figure>
            <figure class="archive-frame is-four" data-live-primary><img loading="lazy" decoding="async" src="images/graphic-archive-v2/dog.webp" width="2400" height="2400" alt="Day of Giving event identity"><figcaption>Day of Giving event identity</figcaption></figure>
            <figure class="archive-frame is-eight" data-live-primary><img loading="lazy" decoding="async" src="images/gg-ibm-fan.jpg" width="1800" height="1350" alt="IBM Be Equal Pride fan"><figcaption>IBM Be Equal Pride fan</figcaption></figure>
            <figure class="archive-frame is-full" data-live-primary><img loading="lazy" decoding="async" src="images/logos-1.jpg" width="4000" height="2250" alt="Collection of identity marks"><figcaption>Identity collection</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/graphic-archive-v2/chantico.webp" width="2400" height="2000" alt="Three illustrated Chantico bottle applications"><figcaption>Chantico bottle applications</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/logos-3.jpg" width="2500" height="1500" alt="STM banner"><figcaption>STM banner</figcaption></figure>
            <figure class="archive-frame is-third" data-live-primary><img loading="lazy" decoding="async" src="images/logos-4.jpg" width="1698" height="1080" alt="Brand identity hero composition"><figcaption>Identity application</figcaption></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="graphic-events-title">
          <div class="archive-chapter-head"><p class="graphic-section-kicker">Selected visual systems</p><h2 id="graphic-events-title">Campaigns and illustration systems</h2></div>
          <div class="graphic-events">
            <figure class="archive-frame is-event-tall"><img loading="lazy" decoding="async" src="images/graphic-archive-v2/abex.webp" width="1250" height="1875" alt="Ability Experience fortieth anniversary event graphic"><figcaption>AbEx 40</figcaption></figure>

            <figure class="archive-frame is-event-tall"><img loading="lazy" decoding="async" src="images/graphic-archive-v2/ibm-paltron-illustration-system.webp" width="2400" height="4168" alt="IBM Cloud PALtron illustration system sheet with separated assets, color treatments, and object explorations"><figcaption>IBM Cloud PALtron illustration system</figcaption></figure>
            <figure class="archive-frame is-event-wide"><img loading="lazy" decoding="async" src="images/graphic-archive-v2/wxo-illustration-system.webp" width="2400" height="1920" alt="IBM watsonx Orchestrate illustration composition with people, gestures, gradients, paths, and interface motifs"><figcaption>IBM watsonx Orchestrate illustration system</figcaption></figure>
          </div>
        </section>

        <section class="archive-chapter" aria-labelledby="graphic-illustrations-title">
          <div class="archive-chapter-head"><h2 id="graphic-illustrations-title">Selected illustrations</h2></div>
          <div class="graphic-illustrations">
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/gg-illus-1.jpg" width="1117" height="1600" alt="Little Shop"><figcaption>Little Shop</figcaption></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/gg-illus-2.jpg" width="1034" height="1600" alt="The Wiz"><figcaption>The Wiz</figcaption></figure>
            <figure class="archive-frame" data-live-primary><img loading="lazy" decoding="async" src="images/gg-illus-3.jpg" width="1120" height="1600" alt="Tran Designer"><figcaption>Tran Designer</figcaption></figure>
            <figure class="archive-frame mendenhall-gallery-poster" data-live-primary>
              <button type="button" class="mendenhall-archive-trigger" aria-haspopup="dialog" aria-controls="mendenhall-archive-dialog" aria-label="Open archive: Mendenhall type design">
                <img loading="lazy" decoding="async" src="images/gg-illus-4.jpg" width="933" height="1600" alt="Complete Mendenhall type specimen poster">
                <span class="mendenhall-archive-cue" aria-hidden="true"></span>
              </button>
            </figure>
          </div>
        </section>
        <dialog class="mendenhall-archive-dialog" id="mendenhall-archive-dialog" data-mendenhall-dialog aria-labelledby="mendenhall-archive-title">
          <div class="mendenhall-archive-topbar">
            <p>Graphic Design archive</p>
            <button type="button" class="mendenhall-archive-close" aria-label="Close Mendenhall archival view" autofocus><span aria-hidden="true">×</span></button>
          </div>
          <div class="mendenhall-archive-layout">
            <div class="mendenhall-archive-stage">
              <img class="mendenhall-archive-master" data-mendenhall-master="poster" data-src="images/gg-illus-4.jpg" width="933" height="1600" alt="Complete Mendenhall type specimen poster">
              <img class="mendenhall-archive-master" data-mendenhall-master="sentence" data-src="images/mendenhall/type-thumbnail.png" width="1500" height="1500" alt="Mendenhall sentence specimen reading from the heart of the frozen glacier" hidden>
              <img class="mendenhall-archive-master" data-mendenhall-master="alphabet" data-src="images/mendenhall/mendenhall-layout.png" width="7292" height="3125" alt="Complete Mendenhall lowercase alphabet and type specimen sheet" hidden>
              <img class="mendenhall-archive-master" data-mendenhall-master="sketches" data-src="images/mendenhall/mendenhall-sketches.webp" width="2500" height="1087" alt="Hand-built Mendenhall letterform sketches and physical studies" hidden>
            </div>
            <aside class="mendenhall-archive-details" aria-label="Mendenhall project details">
              <p class="mendenhall-archive-kicker">2015 type design exploration</p>
              <h2 id="mendenhall-archive-title">Mendenhall</h2>
              <p class="mendenhall-archive-lede">A student type-design study shaped around geometric letterforms, a glacier-inspired sentence specimen, and hands-on form studies.</p>
              <dl class="mendenhall-archive-metadata">
                <div><dt>Role</dt><dd>Type designer</dd></div>
                <div><dt>Format</dt><dd>Poster and letterform studies</dd></div>
                <div><dt>Status</dt><dd>Student exploration</dd></div>
              </dl>
              <p class="mendenhall-archive-views-title">Project views</p>
              <div class="mendenhall-archive-views" aria-label="Available Mendenhall views">
                <button type="button" class="mendenhall-archive-view" data-mendenhall-view="poster" aria-pressed="true" aria-label="View complete type poster"><img loading="lazy" decoding="async" data-src="images/gg-illus-4.jpg" width="933" height="1600" alt="Complete Mendenhall poster thumbnail"></button>
                <button type="button" class="mendenhall-archive-view" data-mendenhall-view="sentence" aria-pressed="false" aria-label="View sentence specimen"><img loading="lazy" decoding="async" data-src="images/mendenhall/type-thumbnail.png" width="1500" height="1500" alt="Sentence specimen thumbnail"></button>
                <button type="button" class="mendenhall-archive-view" data-mendenhall-view="alphabet" aria-pressed="false" aria-label="View complete alphabet specimen"><img loading="lazy" decoding="async" data-src="images/mendenhall/mendenhall-layout.png" width="7292" height="3125" alt="Alphabet specimen thumbnail"></button>
                <button type="button" class="mendenhall-archive-view" data-mendenhall-view="sketches" aria-pressed="false" aria-label="View sketches and physical studies"><img loading="lazy" decoding="async" data-src="images/mendenhall/mendenhall-sketches.webp" width="2500" height="1087" alt="Letterform studies thumbnail"></button>
              </div>
              <p class="mendenhall-archive-status sr-only" aria-live="polite">Complete poster view selected.</p>
            </aside>
          </div>
        </dialog>
        <section class="archive-chapter" aria-labelledby="graphic-wide-title">
          <div class="archive-chapter-head"><h2 id="graphic-wide-title">Wide-format information design</h2></div>
          <figure class="archive-frame graphic-wide" data-live-primary><img loading="lazy" decoding="async" src="images/gg-infographic.jpg" width="2400" height="959" alt="Wide informational graphic"><figcaption>Infographic</figcaption></figure>
        </section>
      </div>
    </section>
'''

# Keep the primary Graphic archive art-led and compact; descriptive alt text
# carries object identity without repeating small labels under every image.
GRAPHIC_PRIMARY = re.sub(r'<figcaption>[\s\S]*?</figcaption>', '', GRAPHIC_PRIMARY)
GRAPHIC_PRIMARY = re.sub(r'[ \t]+\n', '\n', GRAPHIC_PRIMARY)

GRAPHIC_RESPONSIVE = {
    'images/logos-2.jpg': ('opening', [480, 768, 1200]), 'images/gg-edc-1.jpg': ('half', [320, 480]),
    'images/gg-edc-0.jpg': ('half', [480, 768, 1280]), 'images/gg-edc-2.jpg': ('half', [480, 768, 1280]), 'images/gg-edc-3.jpg': ('half', [480, 768, 1280]),
    'images/thumb-sgla.webp': ('third', [320, 480, 768]), 'images/graphic-archive-v2/sgla-2024-identity-development.webp': ('feature', [480, 768, 1200]), 'images/graphic-archive-v2/sgla-2023-brand-guidelines.webp': ('half', [480, 768, 1280]), 'images/graphic-archive-v2/sgla-2024-ballroom-system.webp': ('half', [480, 768, 1280]), 'images/graphic-archive-v2/sgla-2024-signage-system.webp': ('full', [768, 1280, 2048]),
    **{f'images/gg-slides-{number}.jpg': ('slides', [320, 480, 640]) for number in range(1, 17)},
    'images/gg-day-of-giving.png': ('third', [480, 768, 1024]), 'images/graphic-archive-v2/dog.webp': ('third', [480, 768, 1024]), 'images/gg-ibm-fan.jpg': ('feature', [480, 1024, 1600]), 'images/logos-1.jpg': ('full', [768, 1280, 2048]), 'images/graphic-archive-v2/chantico.webp': ('third', [480, 768, 1024]), 'images/logos-3.jpg': ('third', [480, 768, 1024]), 'images/logos-4.jpg': ('third', [480, 768, 1024]), 'images/graphic-archive-v2/abex.webp': ('tall', [480, 768, 1200]), 'images/graphic-archive-v2/ibm-paltron-illustration-system.webp': ('tall', [480, 768, 1200]), 'images/graphic-archive-v2/wxo-illustration-system.webp': ('wide', [480, 768, 1280]), 'images/gg-illus-1.jpg': ('illustration', [320, 480, 768]), 'images/gg-illus-2.jpg': ('illustration', [320, 480, 768]), 'images/gg-illus-3.jpg': ('illustration', [320, 480, 768]), 'images/gg-infographic.jpg': ('full', [768, 1280, 2048]),
}
GRAPHIC_SIZES = {
    'opening': '(max-width: 720px) calc(100vw - 40px), (max-width: 1600px) calc(61.75vw - 62px), 926px', 'half': '(max-width: 720px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 48px), (max-width: 1600px) calc(50vw - 60px), 740px', 'third': '(max-width: 720px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 48px), (max-width: 1600px) calc(33.333vw - 48px), 485px', 'feature': '(max-width: 720px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 48px), (max-width: 1600px) calc(66.667vw - 104px), 995px', 'full': '(max-width: 720px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 48px), (max-width: 1600px) calc(100vw - 96px), 1504px', 'slides': '(max-width: 720px) calc((100vw - 48px) / 2), (max-width: 900px) calc((100vw - 72px) / 4), (max-width: 1199px) calc((100vw - 120px) / 4), (max-width: 1600px) calc((100vw - 128px) / 5), 294px', 'tall': '(max-width: 720px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 48px), (max-width: 1600px) calc(41.667vw - 78px), 589px', 'wide': '(max-width: 720px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 48px), (max-width: 1600px) calc(58.333vw - 114px), 851px', 'illustration': '(max-width: 720px) calc((100vw - 56px) / 2), (max-width: 1600px) calc(25vw - 42px), 358px',
}
def responsive_graphic_image(match: re.Match) -> str:
    tag = match.group(0)
    source_match = re.search(r'\bsrc="([^"]+)"', tag)
    source = source_match.group(1) if source_match else ''
    if source not in GRAPHIC_RESPONSIVE:
        return tag
    profile, widths = GRAPHIC_RESPONSIVE[source]
    stem = Path(source).stem
    original_width = re.search(r'\bwidth="(\d+)"', tag).group(1)
    srcset = ', '.join([*(f'images/responsive/graphic/{stem}-w{width}.webp {width}w' for width in widths), f'{source} {original_width}w'])
    thumb = f'images/responsive/graphic/{stem}-w{widths[0]}.webp'
    if 'loading="eager"' in tag:
        return tag[:-1] + f' srcset="{srcset}" sizes="{GRAPHIC_SIZES[profile]}" data-full-src="{source}" data-thumb-src="{thumb}">'
    deferred_tag = tag.replace(f'src="{source}"', f'src="{RESPONSIVE_PLACEHOLDER}"', 1)
    return deferred_tag[:-1] + (
        f' data-deferred-src="{source}" data-deferred-srcset="{srcset}" '
        f'data-deferred-sizes="{GRAPHIC_SIZES[profile]}" data-full-src="{source}" data-thumb-src="{thumb}">'
    )
GRAPHIC_PRIMARY = re.sub(r'<img\b[^>]*>', responsive_graphic_image, GRAPHIC_PRIMARY)


def validate_assets(mapping: dict[str, str], target_name: str) -> None:
    target = ROOT / 'images' / target_name
    expected = set(mapping.values())
    if not target.is_dir():
        raise RuntimeError(f'Missing approved asset directory: {target}')
    present = {item.name for item in target.iterdir() if item.is_file()}
    missing = expected - present
    unexpected = present - expected
    if missing or unexpected:
        raise RuntimeError(
            f'Asset inventory mismatch for {target_name}: '
            f'missing={sorted(missing)} unexpected={sorted(unexpected)}'
        )


def baseline_body(file_name: str) -> str:
    baseline = ROOT / 'archive' / 'pages' / f'{Path(file_name).stem}-2026-07-31' / file_name
    html = baseline.read_text(encoding='utf-8')
    main = re.search(r'<main\b[^>]*>([\s\S]*?)</main>', html, re.I)
    if not main:
        raise RuntimeError(f'Main not found in {baseline}')
    return re.sub(r'\s*<header class="page-header">[\s\S]*?</header>\s*', '\n', main.group(1), count=1, flags=re.I)


def replace_one(html: str, pattern: str, replacement: str, label: str, flags: int = 0) -> str:
    result, count = re.subn(pattern, replacement, html, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f'Expected exactly one {label}; found {count}')
    return result


def build(file_name: str, body_classes: str, data_archive: str, primary: str, skin_css: str,
          extended_title: str, extended_intro: str, meta_desc: str, og_image: str,
          og_width: str, og_height: str, alt_replacements: dict[str, str] | None = None,
          include_extended: bool = True, gallery_nav: str = '') -> None:
    page = ROOT / file_name
    html = page.read_text(encoding='utf-8')
    for marker in [
        '<!-- generated:site-shell-header:start -->',
        '<!-- generated:site-shell-header:end -->',
        '<!-- generated:site-shell-footer:start -->',
        '<!-- generated:site-shell-footer:end -->',
    ]:
        if html.count(marker) != 1:
            raise RuntimeError(f'{file_name}: shared-shell ownership marker must appear exactly once: {marker}')

    old_main = baseline_body(file_name)
    if alt_replacements:
        for old, new in alt_replacements.items():
            old_main = old_main.replace(old, new)
    extended = f'''
    <details class="archive-extended">
      <summary>{extended_title}</summary>
      <p class="archive-extended-intro">{extended_intro}</p>
      <div class="archive-extended-content">{old_main}</div>
    </details>
''' if include_extended else ''
    new_main = (
        f'  <main id="main-content" tabindex="-1" class="page-content" data-archive="{data_archive}">\n'
        f'{primary}{gallery_nav}{extended}  </main>'
    )
    html = replace_one(html, r'<body\b[^>]*>', f'<body class="{body_classes}">', 'body start tag', re.I)
    html = replace_one(html, r'(?m)^[ \t]*<main\b[^>]*>[\s\S]*?</main>', new_main, 'main region', re.I)
    html = re.sub(r'\s*<style id="visual-archive-v2-styles">[\s\S]*?</style>\s*', '\n', html, flags=re.I)
    html = re.sub(r'\s*<style id="(?:art|graphic)-archive-v2-skin">[\s\S]*?</style>\s*', '\n', html, flags=re.I)
    html = re.sub(r'\s*<script src="js/graphicgallery.js"></script>\s*', '\n', html, flags=re.I)
    html = replace_one(html, r'</head>', SHARED_CSS + skin_css + '</head>', 'head close tag', re.I)
    html = replace_one(html, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{meta_desc}">', 'description metadata', re.I)
    html = replace_one(html, r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{meta_desc}">', 'Open Graph description', re.I)
    html = replace_one(html, r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{og_image}">', 'Open Graph image', re.I)
    html = replace_one(html, r'<meta property="og:image:width" content="[^"]*">', f'<meta property="og:image:width" content="{og_width}">', 'Open Graph image width', re.I)
    html = replace_one(html, r'<meta property="og:image:height" content="[^"]*">', f'<meta property="og:image:height" content="{og_height}">', 'Open Graph image height', re.I)
    if file_name == 'graphicgallery.html':
        html = replace_one(html, r'</body>', '  <script src="js/graphicgallery.js"></script>\n</body>', 'graphic archive script insertion', re.I)
    page.write_text(html, encoding='utf-8')


parser = argparse.ArgumentParser(description='Build generator-integrated visual archive candidates.')
parser.add_argument('scope', choices=['art', 'graphic', 'all'])
args = parser.parse_args()

if args.scope in {'art', 'all'}:
    validate_assets(ART_ASSETS, 'art-archive-v2')
    build(
        'artillustration.html', 'visual-archive-page art-archive-v2', 'art-studio-wall', ART_PRIMARY, ART_CSS,
        'Extended studio archive',
        'More character studies, paintings, card work, and experiments from across the archive.',
        'An evolving studio wall of character illustration, personal series, paintings, and experiments by Victor Tran.',
        'https://www.victortrandesign.com/images/art-archive-v2/old-one.webp', '1600', '2071',
        None,
        False,
        '''    <!-- generated:gallery-project-nav:start -->
    <nav class="gallery-project-nav project-nav" aria-label="Gallery navigation">
      <a href="uigallery.html" class="project-nav-item project-nav-item--prev" aria-label="Previous gallery: Interface Studies"><span class="project-nav-label"><span aria-hidden="true">&#x2190;</span> Previous</span><span class="project-nav-title">Interface Studies</span></a>
      <a href="graphicgallery.html" class="project-nav-item project-nav-item--next" aria-label="Next gallery: Graphic Design"><span class="project-nav-label">Next <span aria-hidden="true">&#x2192;</span></span><span class="project-nav-title">Graphic Design</span></a>
    </nav>
    <!-- generated:gallery-project-nav:end -->
''',
    )

if args.scope in {'graphic', 'all'}:
    validate_assets(GRAPHIC_ASSETS, 'graphic-archive-v2')
    build(
        'graphicgallery.html', 'visual-archive-page graphic-archive-v2', 'graphic-contact-sheet', GRAPHIC_PRIMARY, GRAPHIC_CSS,
        'Extended graphic archive',
        'More identity, illustration, presentation, and information-design work from across the archive.',
        'An energetic visual archive spanning identity, print, applications, presentations, and information design by Victor Tran.',
        'https://www.victortrandesign.com/images/logos-2.jpg', '1600', '960',
        {
          'alt="Logo"': 'alt="Collection of identity marks"',
          'alt="Hero"': 'alt="Brand identity hero composition"',
          'alt="Slide 3"': 'alt="Presentation slide composition"',
          'alt="Infographic"': 'alt="Wide informational graphic"',
        },
        False,
        '''    <!-- generated:gallery-project-nav:start -->
    <nav class="gallery-project-nav project-nav" aria-label="Gallery navigation">
      <a href="artillustration.html" class="project-nav-item project-nav-item--prev" aria-label="Previous gallery: Art and Illustration"><span class="project-nav-label"><span aria-hidden="true">&#x2190;</span> Previous</span><span class="project-nav-title">Art &amp; Illustration</span></a>
      <a href="uigallery.html" class="project-nav-item project-nav-item--next" aria-label="Next gallery: Interface Studies"><span class="project-nav-label">Next <span aria-hidden="true">&#x2192;</span></span><span class="project-nav-title">Interface Studies</span></a>
    </nav>
    <!-- generated:gallery-project-nav:end -->
''',
    )

print(f'Built generator-integrated visual archive scope={args.scope}.')
